import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, IonPopover, ToastController, ViewWillEnter } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Profile, ProfileService } from '../../services/profile.service';
import { ddMMyyyyToIso, isoToDdMMyyyy, maskDateInput } from '../../shared/date-mask.util';
import { getErrorMessage } from '../../shared/http-error.util';

const POSITIONS = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'];
const FEET = ['Direito', 'Esquerdo', 'Ambidestro'];

interface RatingBoost {
  attack: number;
  defense: number;
  physical: number;
  skill: number;
}

const NO_BOOST: RatingBoost = { attack: 0, defense: 0, physical: 0, skill: 0 };

const BASE_RATING = 60;

const POSITION_RATING_BOOSTS: Record<string, RatingBoost> = {
  Goleiro: { attack: 0, defense: 4, physical: 1, skill: 1 },
  Zagueiro: { attack: 0, defense: 3, physical: 1, skill: 0 },
  Lateral: { attack: 1, defense: 1, physical: 0, skill: 2 },
  Volante: { attack: 0, defense: 2, physical: 2, skill: 1 },
  Meia: { attack: 2, defense: 0, physical: 0, skill: 3 },
  Atacante: { attack: 4, defense: 0, physical: 1, skill: 0 },
};

@Component({
  standalone: false,
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements ViewWillEnter {
  readonly positions = POSITIONS;
  readonly feet = FEET;

  isEditMode = false;

  nickname = '';
  position = '';
  secondaryPosition = '';
  dominantFoot = '';
  birthDate = '';
  jerseyNumber: number | null = null;

  photoPreviewUrl: string | null = null;
  photoUploading = false;
  private uploadedPhotoUrl: string | null = null;

  nicknameTouched = false;

  loading = false;

  readonly today = new Date().toISOString();

  @ViewChild('birthDatePopover') private birthDatePopover?: IonPopover;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly toastController: ToastController,
    private readonly actionSheetController: ActionSheetController,
  ) {}

  ionViewWillEnter(): void {
    this.resetFormState();
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.applyProfile(profile);
        }
      },
      error: () => {},
    });
  }

  private resetFormState(): void {
    this.isEditMode = false;
    this.nickname = '';
    this.position = '';
    this.secondaryPosition = '';
    this.dominantFoot = '';
    this.birthDate = '';
    this.jerseyNumber = null;
    this.photoPreviewUrl = null;
    this.photoUploading = false;
    this.uploadedPhotoUrl = null;
    this.nicknameTouched = false;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'EDITAR PERFIL' : 'CRIAR PERFIL';
  }

  get submitLabel(): string {
    return this.isEditMode ? 'SALVAR ALTERAÇÕES' : 'CONCLUIR';
  }

  get secondaryPositionOptions(): string[] {
    return this.positions.filter((p) => p !== this.position);
  }

  get nicknameError(): string | null {
    if (!this.nicknameTouched) return null;
    return this.nickname.trim() ? null : 'Informe um apelido.';
  }

  get isFormValid(): boolean {
    return this.nickname.trim().length > 0 && !!this.position && !!this.dominantFoot;
  }

  private get primaryPositionBoost(): RatingBoost {
    return POSITION_RATING_BOOSTS[this.position] ?? NO_BOOST;
  }

  private get secondaryPositionBoost(): RatingBoost {
    return POSITION_RATING_BOOSTS[this.secondaryPosition] ?? NO_BOOST;
  }

  get attackRating(): number {
    return BASE_RATING + this.primaryPositionBoost.attack + this.secondaryPositionBoost.attack;
  }

  get defenseRating(): number {
    return BASE_RATING + this.primaryPositionBoost.defense + this.secondaryPositionBoost.defense;
  }

  get physicalRating(): number {
    return BASE_RATING + this.primaryPositionBoost.physical + this.secondaryPositionBoost.physical;
  }

  get skillRating(): number {
    return BASE_RATING + this.primaryPositionBoost.skill + this.secondaryPositionBoost.skill;
  }

  get birthDateIso(): string | undefined {
    return ddMMyyyyToIso(this.birthDate);
  }

  selectPosition(position: string): void {
    this.position = position;
    if (this.secondaryPosition === position) {
      this.secondaryPosition = '';
    }
  }

  selectSecondaryPosition(position: string): void {
    this.secondaryPosition = this.secondaryPosition === position ? '' : position;
  }

  onBirthDateInput(raw: string): void {
    this.birthDate = maskDateInput(raw);
  }

  openBirthDatePicker(event: MouseEvent): void {
    this.birthDatePopover?.present(event);
  }

  onDateSelected(event: CustomEvent<{ value?: string | string[] | null }>): void {
    const iso = event.detail.value;
    if (typeof iso === 'string') {
      this.birthDate = isoToDdMMyyyy(iso);
    }
    this.birthDatePopover?.dismiss();
  }

  async pickPhoto(): Promise<void> {
    if (this.photoUploading) return;
    const actionSheet = await this.actionSheetController.create({
      header: 'Foto de perfil',
      cssClass: 'photo-source-sheet',
      buttons: [
        { text: 'Tirar foto', icon: 'camera-outline', handler: () => this.capturePhoto(CameraSource.Camera) },
        { text: 'Escolher da galeria', icon: 'image-outline', handler: () => this.capturePhoto(CameraSource.Photos) },
        { text: 'Cancelar', icon: 'close-outline', role: 'cancel' },
      ],
    });
    await actionSheet.present();
  }

  private async capturePhoto(source: CameraSource): Promise<void> {
    let photo;
    try {
      photo = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.Uri, source });
    } catch {
      return;
    }
    if (!photo.webPath) return;

    this.photoPreviewUrl = photo.webPath;

    const blob = await (await fetch(photo.webPath)).blob();
    await this.uploadPhoto(blob, photo.format ?? 'jpeg');
  }

  goBack(): void {
    if (this.isEditMode) {
      this.router.navigateByUrl('/hub');
      return;
    }
    this.authService.logout();
  }

  submit(): void {
    if (this.loading || !this.isFormValid) return;

    this.loading = true;
    const payload: Profile = {
      nickname: this.nickname.trim(),
      position: this.position,
      secondaryPosition: this.secondaryPosition || undefined,
      dominantFoot: this.dominantFoot,
      birthDate: this.birthDate || undefined,
      preferredJerseyNumber: this.jerseyNumber ?? undefined,
      photoUrl: this.uploadedPhotoUrl ?? undefined,
      attackRating: this.attackRating,
      defenseRating: this.defenseRating,
      physicalRating: this.physicalRating,
      skillRating: this.skillRating,
    };

    this.profileService.saveProfile(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/hub');
      },
      error: (error) => {
        this.loading = false;
        this.showError(getErrorMessage(error, 'Não foi possível salvar seu perfil. Tente novamente.'));
      },
    });
  }

  private applyProfile(profile: Profile): void {
    this.isEditMode = true;
    this.nickname = profile.nickname;
    this.position = profile.position;
    this.secondaryPosition = profile.secondaryPosition ?? '';
    this.dominantFoot = profile.dominantFoot;
    this.birthDate = profile.birthDate ?? '';
    this.jerseyNumber = profile.preferredJerseyNumber ?? null;
    this.photoPreviewUrl = profile.photoUrl ?? null;
    this.uploadedPhotoUrl = profile.photoUrl ?? null;
  }

  private async uploadPhoto(blob: Blob, format: string): Promise<void> {
    this.photoUploading = true;
    const contentType = `image/${format}`;
    const fileName = `profile-${Date.now()}.${format}`;

    try {
      const { uploadUrl, photoUrl } = await firstValueFrom(
        this.profileService.requestPhotoUploadUrl({ fileName, fileSize: blob.size, contentType }),
      );
      await firstValueFrom(this.profileService.uploadPhotoToStorage(uploadUrl, blob, contentType));
      this.uploadedPhotoUrl = photoUrl;
      this.photoPreviewUrl = photoUrl;
    } catch (error) {
      this.photoPreviewUrl = null;
      this.showError(getErrorMessage(error, 'Não foi possível enviar a foto agora. Tente de novo mais tarde.'));
    } finally {
      this.photoUploading = false;
    }
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
