# Prorrogação

Sistema de gestão de times de futebol de várzea. Stack: Java 21 + Spring Boot 3 · PostgreSQL · Angular + Ionic (Capacitor).

Fontes de verdade em `/docs`:
- `prorrogacao-documentacao-tecnica.md` — domínio, regras de negócio, ER, endpoints REST rascunho.
- `prorrogacao-app-prototipo.jsx` — protótipo visual (mockup, não produção).

## Convenção de nomenclatura (obrigatória)

Em `prorrogacao-api` e `prorrogacao-app`, **tudo que é código fica em inglês**: nomes de arquivo,
pasta, classe, seletor de componente, rota de URL, método, variável, campo de DTO/interface e path
de endpoint REST. **Só o que é exibido na UI para o usuário final fica em português** (labels,
mensagens de erro/toast, texto de botão, placeholder).

O `prorrogacao-app` (front) já foi renomeado seguindo essa convenção (sessão 2026-08-01) — páginas,
serviços, guard, interceptor e o contrato de API assumido pelo front estão em inglês (ver seção
"Estado atual" abaixo). **Atenção:** `docs/prorrogacao-documentacao-tecnica.md` (ER, diagrama de
classes, enums do domínio, tabela de endpoints da seção 6) **continua em português** — ainda não foi
traduzido. Ou seja, hoje o front usa nomes/enums em inglês (`PRESIDENT`, `PAID`, `INTERNAL`...) que
não batem literalmente com o doc técnico (`PRESIDENTE`, `PAGO`, `INTERNO`...). Ao implementar o
`prorrogacao-api`, seguir a convenção em inglês (não replicar os nomes em português do doc técnico
nas entidades/DTOs/enums Java) — o doc técnico serve pra regra de negócio e modelagem, não pra
nomenclatura literal de código.

O doc técnico já define auth via JWT (access + refresh token), mas sem detalhar implementação.
As seções abaixo documentam um padrão de referência estudado no projeto irmão **beseen-app/beseen-api**
(`/home/emerson/Documentos/beseen`), para reaproveitar quando implementarmos auth aqui. Adaptar, não
copiar cegamente — o BeSeen tem assinatura/subscription que o Prorrogação não tem.

## Auth — padrão de referência (beseen-app / beseen-api)

### Backend (Spring Boot)

- **Refresh token em tabela própria** (`RefreshToken` entity, `@OneToOne` com `User`, token = UUID
  aleatório, `expiryDate` como `Instant`). Cada login/refresh chama `deleteByUserId` antes de criar um
  novo — ou seja, **um único refresh token válido por usuário** (login em outro device invalida o
  anterior). Decidir se esse comportamento de sessão única é desejado para o Prorrogação ou se
  queremos múltiplos refresh tokens por usuário (multi-device).
- **Access token curto (15 min)** via `JwtService`, claims customizadas embutidas no JWT (role,
  nome, e outros dados de perfil) para evitar round-trip extra no front. `JwtFilter`
  (`OncePerRequestFilter`) lê o Bearer token, valida, popula `SecurityContextHolder` com um DTO do
  usuário autenticado; `shouldNotFilter` faz whitelist dos paths públicos de `/auth/`.
- **Fluxo de refresh**: endpoint dedicado recebe o refresh token, busca na tabela, checa expiração
  (deleta e lança `TokenRefreshException` se expirado ou se usuário desabilitado), gera novo par de
  tokens (rotaciona o refresh token a cada uso).
- **Lockout de conta**: `MAX_FAILED_LOGIN_ATTEMPTS = 5`, bloqueia por 15 min (`lockedUntil` na
  entidade `User`), zera contador em login bem-sucedido. Dispara email de aviso ao usuário quando
  bate o limite.
- **Mitigação de user enumeration**: quando o email não existe, ainda assim roda
  `passwordEncoder.matches` contra um hash dummy gerado uma vez (`@PostConstruct`) — mantém o tempo
  de resposta constante entre "usuário não existe" e "senha errada".
- **Rate limiting por IP** (`AuthRateLimitFilter`, Bucket4j + Caffeine, em memória por instância):
  grupo "credential" (login/confirm-code/update-password, 60/min) e grupo "email" (register/resend
  código, 40/hora). Usa header `True-Client-IP` do proxy, não confia em `X-Forwarded-For` (spoofável
  pelo cliente).

### Frontend (Angular + Ionic)

- **`AuthService`** guarda `access_token`/`refresh_token` no `localStorage`, decodifica claims com
  `jwt-decode`, expõe estado via `BehaviorSubject` (`authState`, `currentUser`, `userRole$`).
- **`isTokenExpired`** usa buffer de 5 min antes do `exp` real, pra nunca disparar uma request com
  token prestes a expirar.
- **Refresh concorrente resolvido com flag + Subject**: `isRefreshing` + `refreshTokenSubject`
  garantem que múltiplas requests que expiram ao mesmo tempo disparem **um único** POST de refresh;
  as demais esperam o resultado via `filter(token => token !== null), take(1)`.
- **A chamada de refresh usa `HttpClient` construído a partir de `HttpBackend`** (não do `HttpClient`
  injetado padrão) — bypassa o próprio interceptor de auth, evitando loop infinito de refresh
  disparando refresh.
- **`authInterceptor` (functional, `HttpInterceptorFn`)**: se o token já está expirado antes de
  sair a request, refresha proativamente; se a API responder 401 numa request com token
  aparentemente válido, refresha reativamente e reenvia a request original. Erros de rede
  (`status === 0`) e mensagens de erro genéricas viram toast; refresh falho desloga.
- **`authGuard` funcional** (`CanActivateFn`) checa `isAuthenticated()` e pode redirecionar por role
  lendo o claim decodificado do token, sem chamada extra à API.

### Decisões já tomadas (sessão 2026-07-24)

1. **Multi-device**: várias sessões/refresh tokens simultâneos por usuário (não é single-session
   como o BeSeen). Um novo login não invalida os refresh tokens de outros devices. No backend isso
   significa `RefreshToken` com `@ManyToOne` para `User` (não `@OneToOne`), e o fluxo de refresh
   **rotaciona** apenas o token usado, sem apagar os demais do usuário.
2. **Lockout de conta + rate limiting por IP entram já na v1** (não ficam pra depois do MVP):
   `MAX_FAILED_LOGIN_ATTEMPTS`, bloqueio temporário, e `AuthRateLimitFilter` (Bucket4j) portados
   desde o início do módulo `auth`.
3. Claims do JWT: ainda em aberto. Ponto de partida: token enxuto (sem role/papel embutido, já que
   papéis são por `Filiacao`/por time) — autorização por papel resolvida no backend a cada request.
   Revisar se isso for insuficiente na prática.

### Adaptado, não copiado — divergências deliberadas do padrão BeSeen

Ao implementar o front do Prorrogação (`AuthService`/interceptor/guard), alguns pontos do BeSeen
foram identificados como falhos e **propositalmente não foram replicados**:

- **Fila de refresh concorrente que trava para sempre em caso de falha.** O BeSeen usa
  `refreshTokenSubject.pipe(filter(token => token !== null), take(1))` — se o refresh falhar, o
  subject emite `null`, o `filter` descarta, e quem estava na fila nunca recebe resposta nem erro
  (promise/observable pendurado pra sempre). O Prorrogação usa uma **Promise memoizada**
  (`refreshInFlight`, em `AuthService`) do refresh em andamento — toda chamada concorrente recebe a
  mesma Promise, e ela é limpa (`finally`) quando resolve ou rejeita, propagando sucesso **e** erro
  pra quem está esperando.
- **Qualquer falha no refresh desloga o usuário, inclusive erro de rede.** Contradiz o requisito de
  que o usuário nunca deve ser desconectado por instabilidade — só por refresh token realmente
  inválido/expirado. No Prorrogação, `logout()` automático só acontece quando o endpoint de refresh
  responde 401/403 (refresh token inválido/expirado/revogado). Erro de rede (`status === 0`) ou 5xx
  durante o refresh apenas falha a tentativa atual — o refresh token permanece guardado e a próxima
  request tenta de novo.
- **`AuthService.logout()` acoplado a serviços de outro domínio** (BeSeen chama
  `subscriptionService.clearSubscription()`, `chatService.clearThreads()` de dentro do
  `AuthService`). No Prorrogação o `AuthService` só cuida do próprio estado de auth.
- **`authGuard` com hack de rota hardcoded** (`state.url.startsWith('/create-post')` redirecionando
  por role). Não generaliza, e no Prorrogação os papéis são por `Filiacao` (por time), não um role
  global como no BeSeen — o guard cuida só de autenticação; autorização por papel/time é resolvida
  em outra camada, por endpoint.
- Sem `console.log` de debug no caminho de produção.

## Frontend — armazenamento seguro de token (obrigatório)

`localStorage` **não é usado** para tokens. Requisito: o app roda em mobile (Capacitor,
iOS/Android) e potencialmente também como site puro no futuro — a solução de storage precisa
cobrir os dois sem duas implementações divergentes de auth.

- **Nativo (iOS/Android)**: `@aparajita/capacitor-secure-storage` (MIT, mantido), que usa Keychain
  (iOS) e Android Keystore por baixo — API `SecureStorage.setItem/getItem/removeItem` (import de
  `@aparajita/capacitor-secure-storage`, plugin registrado como `SecureStorage`).
- **Web**: **não existe** keychain/keystore no browser — nenhuma lib resolve isso, é limitação da
  plataforma, não do plugin (a própria implementação web do `@aparajita/capacitor-secure-storage`
  grava sem criptografia no `localStorage`, "só para debug", então não é usada aqui). Mitigação
  adotada: `access_token` fica **só em memória** (variável JS, nunca tocando disco — some ao
  recarregar a página, o que é aceitável já que o refresh token resolve a sessão de novo) e
  `refresh_token` fica em **IndexedDB** (não é criptografia real, só evita ficar junto de outros
  dados em `localStorage` e leitura síncrona trivial). **Hardening real de web fica para uma
  iteração futura**: mover o refresh token para cookie `httpOnly + Secure + SameSite` setado pelo
  backend, endpoint `/auth/refresh-token` lendo da cookie em vez do body — isso exige mudança de
  CORS/credentials e não foi feito nesta rodada.
- Abstração única: `SecureStorageService` (`src/app/services/secure-storage.service.ts`) decide a
  estratégia via `Capacitor.isNativePlatform()`; `AuthService` não sabe qual storage está por trás.
- **Requisito de UX**: o usuário nunca deve ser desconectado só porque o access token (15 min)
  expirou — o app sempre tenta buscar um novo silenciosamente via refresh token antes de desistir.
  Só há logout forçado quando o próprio refresh token é rejeitado pela API (expirado/revogado) — ver
  divergências do BeSeen acima.

## Estado atual: front + módulo auth do backend implementados (2026-08-02)

O front (`prorrogacao-app`) já tem toda a fiação de auth abaixo pronta e buildando (`ng build`
passou limpo). **O `prorrogacao-api` deixou de ser só o esqueleto do Initializr** — o módulo `auth`
já existe e responde de verdade: `register`/`verify-email`/`resend-code`/`login`/`refresh-token`,
com JWT (`JwtService`, claims `sub`/`name`/`email`), lockout de conta (5 tentativas → 15min),
mitigação de user enumeration (hash dummy) e rate limiting por IP (`AuthRateLimitFilter`) — o
padrão de referência do BeSeen (seção acima) foi implementado, adaptado pras decisões já tomadas
(multi-device etc.). Antes de assumir que algo mudou, checar se esses arquivos ainda existem e
bater com a descrição — tanto os do front quanto os do back
(`prorrogacao-api/src/main/java/com/prorrogacao_api/{controller,service,security,exception}`):

- `src/app/services/secure-storage.service.ts` — abstração de storage (ver seção acima).
- `src/app/services/api.service.ts` — wrapper fino de `HttpClient` com `environment.apiUrl`.
- `src/app/services/auth.service.ts` — login/register/verifyEmail/resendCode/refresh/logout.
- `src/app/interceptors/auth.interceptor.ts` — anexa Bearer token, refresh proativo/reativo.
- `src/app/guards/auth.guard.ts` — só autenticação, aplicado em `app-routing.module.ts` nas rotas
  `profile`, `home`, `create-event`, `event`, `draft`, `ratings`, `voting`, `finance`.
- `src/app/shared/http-error.util.ts` — extrai `error.error.message` da resposta HTTP com fallback
  (`getErrorMessage`).
- `app.module.ts` — `provideHttpClient(withInterceptors([authInterceptor]))` +
  `provideAppInitializer` chamando `AuthService.initialize()` (restaura/renova sessão no boot —
  essencial na web, onde o access token não sobrevive a um reload).
- `environment.ts` / `environment.prod.ts` — `apiUrl` (`http://localhost:8080` em dev; o valor de
  prod é só um placeholder, ajustar quando existir domínio real).
- Páginas `login`, `register` (pasta, era `cadastro`), `verify-email` (pasta, era `codigo`) já
  chamam o `AuthService` de verdade (antes só navegavam entre telas sem chamar API nenhuma).
- Demais páginas (todas renomeadas de português pra inglês na sessão 2026-08-01 — pasta, classe,
  seletor e rota): `home`, `profile` (era `perfil`), `create-event` (era `criar-evento`), `event`
  (era `evento`), `draft` (era `sorteio`), `ratings` (era `notas`), `voting` (era `votacao`),
  `finance` (era `financeiro`) — ainda são só mock/UI, sem chamada de API real.

### Contrato de API (implementado no `prorrogacao-api`, módulo `auth` — 2026-08-02)

Nomes de campo em inglês (ver "Convenção de nomenclatura" no topo do arquivo) — só os
valores/mensagens que a UI mostra ficam em português.

| Endpoint | Body | Resposta 2xx |
|---|---|---|
| `POST /auth/register` | `{ name, email, password, acceptedTerms }` | `{ message? }` |
| `POST /auth/verify-email` | `{ email, code }` | `{ message? }` |
| `POST /auth/resend-code` | `{ email }` | `{ message? }` |
| `POST /auth/login` | `{ email, password }` | `{ accessToken, refreshToken, profileCreated }` |
| `POST /auth/refresh-token` | `{ refreshToken }` | `{ accessToken, refreshToken }` |

- **Erros**: `GlobalExceptionHandler` (`prorrogacao-api`) sempre responde
  `{ timestamp, status, error, code, message, path }`. O front lê `error.error.message` pro toast
  (`getErrorMessage`, `http-error.util.ts`) e `error.error.code` (`getErrorCode`) quando precisa
  ramificar por tipo de erro em vez de por texto — texto de mensagem pode mudar (i18n, copy), `code`
  é estável (`VALIDATION_ERROR`, `DUPLICATE_EMAIL`, `USER_NOT_FOUND`, `INVALID_VERIFICATION_CODE`,
  `EMAIL_ALREADY_VERIFIED`, `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `TOKEN_REFRESH_FAILED`,
  `INTERNAL_ERROR`).
- **Login com e-mail não confirmado redireciona pra verificação** (`login.page.ts`, sessão
  2026-08-02): `EmailNotVerifiedException` responde **403** com `code: "EMAIL_NOT_VERIFIED"` —
  deliberadamente separado de `InvalidCredentialsException` (401, senha errada), que antes caíam no
  mesmo handler/status e só se diferenciavam pelo texto da mensagem. O front checa **status 403 E
  code `EMAIL_NOT_VERIFIED` juntos** (`isEmailNotVerified()`) antes de redirecionar pra
  `/verify-email` — checar só o status seria arriscado (um 403 futuro por outro motivo não deveria
  mandar o usuário pra lá). Isso existe pra não deixar o usuário travado se ele fechar o app na tela
  de código depois do cadastro: tentar logar de novo mais tarde o manda de volta pra
  `/verify-email` (com o e-mail já preenchido via `state`) em vez de só mostrar um erro genérico.
- `profileCreated` no login decide se o front manda o usuário pra `/profile` (criar perfil de
  atleta) ou `/home`.
- Claims do access token (JWT) que o front decodifica: `sub` (id do usuário), `name`, `email`,
  `exp`, `iat` — nada de papel/role embutido (ver "Decisões já tomadas", item 3).
- `/auth/refresh-token` **rotaciona** o refresh token a cada uso (retorna um novo par) — combina com
  a decisão de multi-device: só o refresh token usado é substituído, os outros devices do mesmo
  usuário continuam válidos.
- **`acceptedTerms`** (boolean): a tela de cadastro (`register.page.ts`) só envia `true` — o botão
  "LI E ACEITO OS TERMOS" no modal de termos (`(pressed)="acceptTerms(termsModal)"`) só habilita
  depois que o usuário rola o texto até o fim (`hasReadTermsToBottom`, via `onTermsScroll`); sem
  isso, `submit()` bloqueia o cadastro no próprio front com toast, sem nem chamar a API. Padrão
  adaptado do `beseen-app` (`signup.page.ts`/`.html`), que faz o mesmo scroll-gate. O
  `prorrogacao-api` replica a validação server-side: `RegisterRequest.acceptedTerms` tem
  `@AssertTrue`, rejeitando `false` com 400 (`VALIDATION_ERROR`) — `User.acceptedTerms` é uma coluna
  boolean simples (sem entidade/versão de termos separada, igual ao BeSeen). O texto dos termos
  exibido no modal é **provisório** (placeholder adaptado ao domínio do Prorrogação) e precisa ser
  revisado/substituído antes do lançamento — não existe endpoint pra buscar o texto/versão dos
  termos, é estático no template (`register.page.html`), igual ao padrão do BeSeen.
- **Validação client-side no cadastro** (`register.page.ts`): e-mail por regex (`EMAIL_PATTERN`),
  senha com **mínimo 8 caracteres** (`MIN_PASSWORD_LENGTH`), confirmação de senha igual à senha,
  nome não vazio, e `acceptedTerms` true — todos via getters (`isFormValid`) sem Reactive Forms (o
  app usa binding simples `[(value)]` no `app-field`, não `FormGroup`). O botão "CONTINUAR" fica
  `[disabled]` até `isFormValid`. É só UX — o `prorrogacao-api` valida de novo server-side
  (`RegisterRequest`: `@NotBlank`/`@Email`/`@Size(min = 8)`/`@AssertTrue`), mesmo mínimo de 8
  caracteres dos dois lados.
- **Erro de rede/API fora do ar tratado no `authInterceptor`** (sessão 2026-08-01): antes, requests
  pros paths públicos de auth (`/auth/register`, `/auth/login`, etc.) passavam batido pelo
  interceptor sem nenhum `catchError` — quando a API está fora do ar, o Angular retorna
  `HttpErrorResponse` com `status === 0` e sem corpo, e cada página caía no texto de fallback
  genérico (`getErrorMessage(error, 'Não foi possível criar a conta...')`), confundindo "API fora
  do ar" com qualquer outro erro de negócio. Agora o interceptor detecta `status === 0` (rede
  indisponível, servidor fora do ar, CORS bloqueado — o browser não distingue os três) **pra
  qualquer request de `environment.apiUrl`**, autenticada ou não, e reescreve o erro com
  `error.error.message` = "Não foi possível conectar ao servidor. Verifique sua internet e tente
  novamente em instantes." — como `getErrorMessage` (`http-error.util.ts`) já lê esse campo, todas
  as páginas mostram a mensagem certa automaticamente, sem precisar de lógica própria por tela.

### `POST /auth/logout` (implementado, não é rascunho)

Apaga o refresh token daquele device específico (`refreshTokenRepository.deleteByToken`) — não
todos os do usuário, combina com a decisão de multi-device. Endpoint público (identidade vem do
próprio `refreshToken` no body, igual `/auth/refresh-token`), idempotente (token já ausente não é
erro). `AuthService.logout()` do front (`auth.service.ts`) chama esse endpoint **best-effort**
antes de limpar o storage local — se a chamada falhar (rede, token já inválido), o logout local
segue de qualquer forma, não pode travar o usuário na tela.

### Tela de perfil: criação/edição reaproveitada, card estilo FIFA (sessão 2026-08-02)

`profile.page.ts` deixou de ser mock — decisões tomadas nessa sessão, registradas aqui porque
divergem ou completam o que o doc técnico define:

- **Uma tela só pra criar E editar o perfil.** O modo é inferido pelo próprio estado, não por uma
  flag de rota: `ionViewWillEnter` chama `ProfileService.getMyProfile()` — se vier um perfil,
  `isEditMode = true`; se vier `null` (404, inclusive porque o endpoint nem existe ainda no
  backend), assume criação. Evita o risco de a tela "achar" que está num modo errado por causa de
  um parâmetro de URL dessincronizado.
- **`ionViewWillEnter`, não `ngOnInit` — de propósito, por causa do `IonicRouteStrategy`**
  (`app.module.ts`): ele cacheia páginas em vez de destruí-las ao navegar pra fora, então
  `ngOnInit` só roda uma vez na vida da instância. Bug real encontrado nessa sessão: sair do
  perfil (modo criação → `<` desloga, ver abaixo) e logar com **outra conta que também não tem
  perfil** reaproveitava a MESMA instância de `ProfilePage`, com os campos ainda preenchidos da
  conta anterior — vazamento de dado entre sessões. Corrigido com `ionViewWillEnter` (dispara toda
  vez que a página fica ativa, cache ou não, inclusive na primeira entrada) chamando
  `resetFormState()` antes de buscar o perfil de novo. **Vale pra qualquer página futura que
  guarde estado sensível em propriedades de instância** — `ngOnInit` sozinho não é suficiente
  nesse app pra "resetar ao reentrar", precisa de `ionViewWillEnter`.
- **Regra do botão `<` (`goBack()`)**: em modo criação, volta = **logout de verdade** (
  `authService.logout()`, que já apaga o refresh token na API — ver seção acima) e manda pra
  `/login`, porque essa tela é etapa obrigatória pós-cadastro, não tem "cancelar e voltar pra
  algum lugar" sem perfil. Em modo edição, volta só navega pra `/home` — **não desloga**. Hoje só
  existe UM ponto de entrada pra essa tela (o redirect do `login.page.ts` quando `!profileCreated`),
  então na prática ela sempre abre em modo criação por enquanto — o modo edição só passa a ser
  alcançável quando existir uma entrada tipo "meu perfil" em algum outro lugar do app.
- **`numero_camisa` do ER (seção 4 do doc técnico) é campo de `FILIACAO` (por time), não de
  `PERFIL`.** Como essa tela roda antes do usuário estar em qualquer time, decidimos **não** pedir
  o número de camisa "de verdade" aqui — o campo (`preferredJerseyNumber` no front) é uma
  conveniência do perfil global (o `app-jersey-number-picker` interativo), usada só como sugestão
  de número quando o usuário entrar num time depois (a unicidade real por time continua sendo
  responsabilidade da `FILIACAO`, ainda não implementada).
- **Foto de perfil — fluxo de URL pré-assinada (S3), contrato assumido pelo front** (igual o padrão
  já usado pra auth: front inventa, backend implementa depois):

  | Endpoint | Body | Resposta 2xx |
  |---|---|---|
  | `POST /profile/photo-upload-url` | `{ fileName, fileSize, contentType }` | `{ uploadUrl, photoUrl }` |
  | `PUT {uploadUrl}` (S3, fora da nossa API) | bytes crus da imagem | — |
  | `GET /profile` | — | `Profile` ou 404 |
  | `PUT /profile` | `Profile` (inclui `photoUrl` já confirmado) | `Profile` |

  `ProfileService.uploadPhotoToStorage()` usa um `HttpClient` construído a partir de `HttpBackend`
  (mesmo truque do `AuthService` pro refresh) — **não pode** passar pelo `authInterceptor`, porque
  a URL pré-assinada não é da nossa API (não tem `environment.apiUrl` como prefixo, autentica pela
  assinatura na própria URL, não pelo nosso Bearer token). Fluxo no front
  (`profile.page.ts#pickPhoto/uploadPhoto`): `@capacitor/camera` (`Camera.getPhoto`, funciona em
  web via `getUserMedia`/file picker, não só nativo) → preview local imediato (`photo.webPath`,
  funciona direto num `<img>`) → pede a URL assinada → `PUT` pro S3 → só then troca o preview local
  pela URL final e habilita ela no payload de salvar perfil. **Infra de S3 real (bucket,
  credenciais AWS, o endpoint em si) ainda não existe no `prorrogacao-api`** — combinado que fica
  pra depois; por ora a chamada falha (toast de erro) — desde a sessão 2026-08-02 (ajuste posterior),
  o preview local some do card nesse caso (`photoPreviewUrl = null` no `catch` de
  `uploadPhoto()`), tanto pra erro pedindo a URL assinada quanto pra erro no `PUT` do S3 — antes a
  foto escolhida continuava aparecendo no card mesmo sem ter sido confirmada, o que dava a entender
  (errado) que o envio tinha funcionado.
- **Componentes novos no `shared`**: `app-player-card` — reescrito na sessão 2026-08-02 no visual
  "escudo/brasão" (topo reto, ponta pra baixo, `clip-path: polygon(...)` puro, sem SVG) da
  referência `docs/card-salah-v2.html`: número da camisa + posição no topo da coluna esquerda,
  bandeira do Brasil (estática, decorativa — o app não tem campo de nacionalidade) logo abaixo, e
  marca d'água vertical "prorrogação" (`writing-mode: vertical-rl`) no rodapé da coluna, empurrada
  pra baixo via `margin-top: auto`. Clicar em qualquer parte do card (inclusive na foto, o clique
  builda até o wrapper) dispara um efeito de toque (`tapped`, componente controla via
  `setTimeout`/`TAP_EFFECT_DURATION_MS`) que replica o `:hover` da referência — lift/scale do card
  + brilho diagonal varrendo (`.card-shine`, `transition: left`) — via classe, já que `:hover` não
  faz sentido em touch.
  **Decisão revertida nessa mesma sessão**: o card agora mostra sim ATA/DEF/FOR/HAB (getters
  `attackRating`/`defenseRating`/`physicalRating`/`skillRating` em `profile.page.ts`, também
  adicionados ao `Profile` em `profile.service.ts`) — a ressalva antiga era não deixar o próprio
  atleta se autoavaliar, mas o combinado agora é: todo perfil começa com base 60 em cada atributo, a
  posição **principal e a secundária** somam um boost próprio por atributo (tabela
  `POSITION_RATING_BOOSTS`, ex.: zagueiro puxa defesa forte + um pouco de força; lateral puxa um
  pouco de habilidade; atacante puxa ataque forte) — é só o valor inicial, pensado como ponto de
  partida pra um sistema futuro de votação de habilidade entre os próprios atletas (ainda não
  implementado), não uma autoavaliação livre. O pill de pé dominante no card mostra só o valor cru
  (`Direito`/`Esquerdo`/`Ambidestro`), sem prefixo "Pé" — combinado nessa sessão porque "Pé
  Ambidestro" não faz sentido gramatical.
  `app-jersey-number-picker` (camisa em SVG com +/- pra escolher o número, `[(value)]` bindable)
  não mudou.
- **Campo de data de nascimento** é só um `app-field` de texto livre com ícone de calendário
  (mesma convenção "leve" já usada nas telas mock pra data, ex. `criar-evento`), não um date
  picker de verdade — decisão de escopo pra não introduzir mais um padrão de interação nessa
  rodada, pode virar um `ion-datetime` num modal depois se quiser algo mais robusto.

### Próximo passo combinado

Módulo `auth` do `prorrogacao-api` implementado (2026-08-02), incluindo `/auth/logout`. Backend
ainda precisa: módulo `usuario`/perfil (`GET/PUT /profile`) e a infra de upload de foto (S3 +
`POST /profile/photo-upload-url`) pra tela de perfil funcionar de ponta a ponta — contrato assumido
documentado acima. Depois: `time`/filiação (que é onde `numero_camisa` de verdade mora), seguindo a
estrutura de camadas da seção 6 do doc técnico (`config`, `auth`, `usuario`, `time`, ...).
