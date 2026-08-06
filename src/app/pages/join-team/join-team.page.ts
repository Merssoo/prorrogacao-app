import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InfiniteScrollCustomEvent, ToastController, ViewWillEnter } from '@ionic/angular';
import { EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { TeamSearchPage, TeamSearchResult, TeamsService } from '../../services/teams.service';
import { getErrorMessage } from '../../shared/http-error.util';

const SEARCH_DEBOUNCE_MS = 1200;
const PAGE_SIZE = 15;

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

@Component({
  standalone: false,
  selector: 'app-join-team',
  templateUrl: './join-team.page.html',
  styleUrls: ['./join-team.page.scss'],
})
export class JoinTeamPage implements OnInit, OnDestroy, ViewWillEnter {
  query = '';
  results: TeamSearchResult[] = [];
  loading = false;
  hasSearched = false;
  requestingTeamId: number | null = null;

  private page = 0;
  private hasNext = false;
  private readonly queryChanged = new Subject<string>();
  private readonly destroyed = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly teamsService: TeamsService,
    private readonly toastController: ToastController,
  ) {}

  ngOnInit(): void {
    this.queryChanged
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((query) => this.runSearch(query)),
        takeUntil(this.destroyed),
      )
      .subscribe((result) => this.applySearchResult(result));
  }

  ionViewWillEnter(): void {
    this.resetState();
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private resetState(): void {
    this.query = '';
    this.results = [];
    this.loading = false;
    this.hasSearched = false;
    this.requestingTeamId = null;
    this.page = 0;
    this.hasNext = false;
  }

  crestOf(teamName: string): string {
    return initialsOf(teamName);
  }

  get canLoadMore(): boolean {
    return this.hasSearched && this.hasNext;
  }

  onQueryInput(value: string): void {
    this.query = value;
    const trimmed = value.trim();

    if (!trimmed) {
      this.results = [];
      this.hasSearched = false;
      this.loading = false;
      return;
    }

    this.loading = true;
    this.queryChanged.next(trimmed);
  }

  loadMore(event: InfiniteScrollCustomEvent): void {
    const trimmed = this.query.trim();
    if (!trimmed || !this.hasNext) {
      event.target.complete();
      return;
    }

    const nextPage = this.page + 1;
    this.teamsService.searchTeams(trimmed, nextPage, PAGE_SIZE).subscribe({
      next: (result) => {
        this.page = nextPage;
        this.hasNext = result.hasNext;
        this.results = [...this.results, ...result.content];
        event.target.complete();
      },
      error: () => {
        event.target.complete();
      },
    });
  }

  onCardClick(team: TeamSearchResult): void {
    if (team.myMembershipStatus) return;
    this.requestToJoin(team);
  }

  requestToJoin(team: TeamSearchResult): void {
    if (this.requestingTeamId !== null) return;

    this.requestingTeamId = team.teamId;
    this.teamsService.requestToJoinTeam(team.teamId).subscribe({
      next: () => {
        this.requestingTeamId = null;
        team.myMembershipStatus = 'PENDING';
        this.showToast('Pedido enviado! Você vai poder acompanhar no seu hub.', 'medium');
      },
      error: (error) => {
        this.requestingTeamId = null;
        this.showToast(getErrorMessage(error, 'Não foi possível solicitar entrada agora.'), 'danger');
      },
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/hub');
  }

  private runSearch(query: string) {
    this.page = 0;
    this.hasSearched = true;
    return this.teamsService.searchTeams(query, 0, PAGE_SIZE).pipe(
      catchError((error) => {
        this.loading = false;
        this.showToast(getErrorMessage(error, 'Não foi possível buscar times agora.'), 'danger');
        return EMPTY;
      }),
    );
  }

  private applySearchResult(result: TeamSearchPage): void {
    this.results = result.content;
    this.hasNext = result.hasNext;
    this.loading = false;
  }

  private async showToast(message: string, color: 'danger' | 'medium'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: color === 'danger' ? 3000 : 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
