import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, IonPopover, ToastController, ViewWillEnter } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { firstValueFrom } from 'rxjs';
import { TeamsService } from '../../services/teams.service';
import { CrestShape } from '../../shared/components/team-crest-picker/team-crest-picker.component';
import { ddMMyyyyToIso, isoToDdMMyyyy, maskDateInput } from '../../shared/date-mask.util';
import { getErrorMessage } from '../../shared/http-error.util';

@Component({
  standalone: false,
  selector: 'app-create-team',
  templateUrl: './create-team.page.html',
  styleUrls: ['./create-team.page.scss'],
})
export class CreateTeamPage implements ViewWillEnter {
  name = '';
  foundationDate = '';
  city = '';
  description = '';
  homeField = '';
  loading = false;

  crestShape: CrestShape = 'SHIELD';
  crestPreviewUrl: string | null = null;
  crestUploading = false;
  private uploadedCrestUrl: string | null = null;

  readonly today = new Date().toISOString();

  @ViewChild('foundationDatePopover') private foundationDatePopover?: IonPopover;

  constructor(
    private readonly router: Router,
    private readonly teamsService: TeamsService,
    private readonly toastController: ToastController,
    private readonly actionSheetController: ActionSheetController,
  ) {}

  ionViewWillEnter(): void {
    this.resetState();
  }

  private resetState(): void {
    this.name = '';
    this.foundationDate = '';
    this.city = '';
    this.description = '';
    this.homeField = '';
    this.loading = false;
    this.crestShape = 'SHIELD';
    this.crestPreviewUrl = null;
    this.crestUploading = false;
    this.uploadedCrestUrl = null;
  }

  get isFormValid(): boolean {
    return this.name.trim().length > 0;
  }

  get foundationDateIso(): string | undefined {
    return ddMMyyyyToIso(this.foundationDate);
  }

  onFoundationDateInput(raw: string): void {
    this.foundationDate = maskDateInput(raw);
  }

  openFoundationDatePicker(event: MouseEvent): void {
    this.foundationDatePopover?.present(event);
  }

  onFoundationDateSelected(event: CustomEvent<{ value?: string | string[] | null }>): void {
    const iso = event.detail.value;
    if (typeof iso === 'string') {
      this.foundationDate = isoToDdMMyyyy(iso);
    }
    this.foundationDatePopover?.dismiss();
  }

  onCrestShapeChange(shape: CrestShape): void {
    this.crestShape = shape;
  }

  async pickCrestPhoto(): Promise<void> {
    if (this.crestUploading) return;
    const actionSheet = await this.actionSheetController.create({
      header: 'Escudo do time',
      cssClass: 'photo-source-sheet',
      buttons: [
        { text: 'Tirar foto', icon: 'camera-outline', handler: () => this.captureCrestPhoto(CameraSource.Camera) },
        { text: 'Escolher da galeria', icon: 'image-outline', handler: () => this.captureCrestPhoto(CameraSource.Photos) },
        { text: 'Cancelar', icon: 'close-outline', role: 'cancel' },
      ],
    });
    await actionSheet.present();
  }

  goBack(): void {
    this.router.navigateByUrl('/hub');
  }

  submit(): void {
    if (this.loading || !this.isFormValid) return;

    this.loading = true;
    this.teamsService
      .createTeam({
        name: this.name.trim(),
        crestUrl: this.uploadedCrestUrl ?? undefined,
        crestShape: this.crestShape,
        foundationDate: this.foundationDate || undefined,
        city: this.city.trim() || undefined,
        description: this.description.trim() || undefined,
        homeField: this.homeField.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl('/hub');
        },
        error: (error) => {
          this.loading = false;
          this.showError(getErrorMessage(error, 'Não foi possível criar o time agora. Tente novamente.'));
        },
      });
  }

  private async captureCrestPhoto(source: CameraSource): Promise<void> {
    let photo;
    try {
      photo = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.Uri, source });
    } catch {
      return;
    }
    if (!photo.webPath) return;

    this.crestPreviewUrl = photo.webPath;

    const blob = await (await fetch(photo.webPath)).blob();
    await this.uploadCrestPhoto(blob, photo.format ?? 'jpeg');
  }

  private async uploadCrestPhoto(blob: Blob, format: string): Promise<void> {
    this.crestUploading = true;
    const contentType = `image/${format}`;
    const fileName = `team-crest-${Date.now()}.${format}`;

    try {
      const { uploadUrl, photoUrl } = await firstValueFrom(
        this.teamsService.requestPhotoUploadUrl({ fileName, fileSize: blob.size, contentType }),
      );
      await firstValueFrom(this.teamsService.uploadPhotoToStorage(uploadUrl, blob, contentType));
      this.uploadedCrestUrl = photoUrl;
      this.crestPreviewUrl = photoUrl;
    } catch (error) {
      this.crestPreviewUrl = null;
      this.showError(getErrorMessage(error, 'Não foi possível enviar o escudo agora. Tente de novo mais tarde.'));
    } finally {
      this.crestUploading = false;
    }
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
