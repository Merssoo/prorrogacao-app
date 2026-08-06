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
  `profile`, `hub`, `home`, `create-event`, `event`, `draft`, `ratings`, `voting`, `finance`.
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
  atleta) ou `/hub` (hub pessoal — ver seção própria abaixo; deixou de ir direto pra `/home` na
  sessão 2026-08-05, porque `/home` agora é a home **de um time específico**, e o hub é quem decide
  pra qual time ir).
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
  algum lugar" sem perfil. Em modo edição, volta só navega pra `/hub` (era `/home`, ajustado na
  sessão 2026-08-05 junto com a criação do hub — perfil é dado do usuário, não de um time
  específico, então faz mais sentido devolver pro espaço pessoal) — **não desloga**. Hoje só
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

### Hub pessoal pós-login (sessão 2026-08-05)

Nova tela `/hub` (`src/app/pages/hub/`), inserida no fluxo **entre** login/criação de perfil e a
home de um time específico:

- **`/home` deixou de ser o destino direto pós-login.** Ela é hoje a home **de um time** (mostra
  nome do time, papel do usuário naquele time, próximo jogo etc. — ver `home.page.html`), mas o
  front ainda não tem conceito de "qual time está selecionado" nem rota por `teamId` (`/home` é
  estático/mock, sempre o mesmo time fake "União da Vila F.C."). O hub é a tela que, no futuro,
  decide pra qual time navegar; por enquanto `openTeam()` (`hub.page.ts`) manda qualquer filiação
  `ACTIVE` pra `/home` de qualquer forma, já que só existe essa uma home mockada — **quando
  `/home` passar a ser por-time de verdade, `openTeam()` precisa navegar com o `teamId` da
  filiação clicada**, não só pra `/home` fixo.
- **Fluxo**: `login.page.ts` manda pra `/hub` quando `profileCreated` (antes ia pra `/home`);
  `profile.page.ts#submit()` (criação/edição de perfil) também passou a mandar pra `/hub` no
  sucesso (antes `/home`); `profile.page.ts#goBack()` em modo edição também devolve pra `/hub`
  (ver seção da tela de perfil acima). Ou seja, **hoje o único jeito de chegar em `/home` é
  clicando numa filiação `ACTIVE` dentro do hub** — não existe mais nenhum redirect direto login →
  home de time.
- **Contrato assumido** (mesmo padrão de "front inventa, backend implementa depois" usado pra
  perfil/foto — `src/app/services/teams.service.ts`):

  | Endpoint | Resposta 2xx |
  |---|---|
  | `GET /teams/my-memberships` | `TeamMembership[]` — `{ teamId, teamName, crest?, status: 'PENDING' \| 'ACTIVE', role? }` |

  Ao contrário de `GET /profile` (recurso único, 404 quando não existe → `Profile \| null`), aqui é
  uma **coleção**: usuário sem nenhum time responde `200` com array vazio, não 404 — "não ter time"
  é estado normal, não erro. `status` e `role` (`Role` de `role-badge.component.ts`:
  `PRESIDENT/TREASURER/COUNCIL_MEMBER/PLAYER`) espelham `StatusFiliacao`/`Papel` do doc técnico
  (seção 4/5, em português: `PENDENTE/ATIVO/INATIVO` e `PRESIDENTE/TESOUREIRO/CONSELHEIRO/JOGADOR`)
  — **`INATIVO` ainda não tem tratamento no front**, `TeamMembership.status` só cobre
  `PENDING`/`ACTIVE` por enquanto (decidir se filiação inativa aparece no hub ou fica oculta quando
  o backend existir).
- **Comportamento por status**: filiação `ACTIVE` mostra o `role-badge` do papel do usuário
  naquele time e é clicável (`openTeam()` → `/home`). Filiação `PENDING` mostra uma pill
  "PENDENTE" (`ion-icon time-outline`) em vez do papel, fica com `opacity: .7` e o clique **não
  navega** — só um toast avisando que ainda está aguardando aprovação (não existe pra onde ir, já
  que o usuário não tem acesso a nada do time ainda).
- **CTAs "Criar time" / "Entrar em um time"** (`app-type-card`, mesmo componente usado noutras
  telas) aparecem **sempre**, tenha ou não times — mesmo quem já tem time pode querer criar/entrar
  em outro (multi-time é decisão já tomada, ver `docs/prorrogacao-documentacao-tecnica.md` seção
  7.4). **Deliberadamente ainda não navegam pra lugar nenhum** — só disparam toast "chega em breve"
  (`createTeam()`/`joinTeam()` em `hub.page.ts`). Combinado explicitamente nesta sessão: criar as
  telas de verdade (formulário de criação de time, fluxo de entrar com convite/código) fica pra uma
  sessão futura, escopo maior que só o hub.
- **Header sem nome/papel de time** (diferente do header de `/home`): só um `icon-btn` de menu à
  esquerda e o sino de notificação (com `.dot`) à direita — decisão explícita do usuário nesta
  sessão, porque o hub é anterior a qualquer time selecionado, não faz sentido mostrar nome/role de
  time nele. Markup/CSS do header **duplicado localmente** em `hub.page.scss` (mesmo padrão que
  `home.page.scss` já usa — cada página tem seu próprio header inline, não existe componente
  compartilhado de header nesse app).
- **Sem `app-bottom-nav`** no hub — as abas (Início/Elenco/Jogos/Caixa) são todas escopo-de-time,
  não fazem sentido antes de estar dentro de um time.
- Saudação com apelido (`ProfileService.getMyProfile()`, mesma chamada real já usada em
  `profile.page.ts`) — `ionViewWillEnter` (não `ngOnInit`, mesmo motivo do `IonicRouteStrategy`
  documentado na seção da tela de perfil) refaz `resetState()` + as duas chamadas toda vez que a
  tela fica ativa.

### Criar time — `Team`/`Membership` implementados de verdade (sessão 2026-08-05)

Primeira fatia real do modelo de autorização combinado com o usuário (salvo em memória,
`project_membership_authorization_model.md`): a role pertence ao **vínculo** entre usuário e time
(`Membership`), não ao usuário; nada de role no JWT; autorização sempre resolvida por request
contra o banco. Esta sessão implementou só **criar time** — solicitar entrada, aprovação de
membership pendente e o filtro `X-Active-Team` (necessário só quando existirem endpoints
escopados a um time específico) ficam pra quando "entrar em time" for implementado.

- **Backend (`prorrogacao-api`)**: `model/Team.java` (`id`, `name`, `createdAt` — sem
  crest/logo, não existe fluxo de upload ainda) e `model/Membership.java` (`team`/`user`
  `@ManyToOne(LAZY)`, `role`, `type`, `status`, `createdAt`/`updatedAt`), migrations Liquibase
  `006-create-teams-table.sql`/`007-create-memberships-table.sql` (`UNIQUE(user_id, team_id)` —
  no máximo um vínculo por pessoa por time). Segue o mesmo padrão **flat por camada técnica** já
  usado por `auth`/`profile` (`controller/`, `service/`, `model/`, `repository/`, `dto/` — não por
  domínio como a seção 6 do doc técnico sugere).
- **Divergência deliberada do ER do doc técnico** (seção 4, `FILIACAO_PAPEL`): lá `papel` é uma
  tabela N:N (uma filiação pode acumular múltiplos papéis, ex. presidente + tesoureiro
  simultâneos). Aqui `role` é **uma coluna única** em `Membership` — decisão explícita do usuário
  passada nesta sessão, um vínculo tem exatamente um papel por vez. Se precisar de acúmulo de
  papéis no futuro, isso exige migração (virar tabela própria de novo).
- **Enums novos** (`model/enums/`), sem `@JsonValue`/label em português — diferente de
  `Position`/`DominantFoot`, serializam como o nome puro do enum (igual `AccountStatus`), porque
  `role` já é 100% inglês no front desde antes (`role-badge.component.ts`):
  - `Role { PRESIDENT, TREASURER, COUNCIL_MEMBER, PLAYER }` — mesmos valores do `Role` do front.
  - `MembershipStatus { PENDING, ACTIVE, INACTIVE }`.
  - `MembershipType { SUBSCRIBER, CASUAL }` — tradução de mensalista/avulso (termo novo, sem uso
    ainda no front além do campo opcional `type?` em `TeamMembership`; elenco/financeiro que vão
    filtrar por `SUBSCRIBER` ainda não existem).
- **Endpoints**: `POST /teams` (`{ name }` → cria `Team` + `Membership(PRESIDENT, SUBSCRIBER,
  ACTIVE)` pro usuário autenticado, dono sem aprovação) e `GET /teams/my-memberships` — mesmo
  contrato que o front já assumia desde a criação do hub, agora implementado de verdade.
  `SecurityConfig` não precisou mudar (`anyRequest().authenticated()` já cobre `/teams/**`).
- **Front**: `teams.service.ts` — `TeamMembership.teamId` virou `number` (backend usa
  `Long`/sequence, não UUID — corrige a divergência que já estava anotada aqui), `MembershipStatus`
  ganhou `INACTIVE` (ainda sem UI própria — `hub.page.html` só não desenha badge/chevron pra esse
  caso, aceitável por ora), novo `MembershipType` e `createTeam()`. Nova página `/create-team`
  (`src/app/pages/create-team/`, só um campo — nome — já que `Team` no backend só tem isso por
  enquanto), visual igual `create-event` (`app-top-bar` com back, `app-field`, `app-info-box`,
  `app-button`). `hub.page.ts#createTeam()` deixou de ser toast placeholder e navega pra lá;
  `joinTeam()` **continua** só toast "chega em breve" — entrar em time é a próxima fatia.
- Fluxo: `/hub` → "Criar time" → `/create-team` → `submit()` chama `POST /teams` → volta pra
  `/hub` (recarrega via `ionViewWillEnter` já existente, mostra o time novo `ACTIVE` com badge
  `PRESIDENT`, clicável pra `/home` — que segue mock fixo sem `teamId`, não mudou nesta sessão).

### Escudo do time — formato + foto (sessão 2026-08-05, mesma sessão de "criar time")

`Team` ganhou `crestUrl`/`crestShape` logo em seguida à implementação inicial (que tinha ficado só
com `name`) — o usuário pediu, na tela de criar time, uma forma de escolher o "brasão" do time
(3 formatos) e colocar uma foto/logo dentro dele, parecido com o recorte do `app-player-card`
(`clip-path: polygon(...)`, ver seção do card estilo FIFA acima).

- **`CrestShape { SHIELD, CIRCLE, HEXAGON }`** (`model/enums/`, backend; reexportado como tipo no
  front por `team-crest-picker.component.ts`, mesmo padrão do `Role` em `role-badge.component.ts`
  — o componente compartilhado é quem "dono" do tipo, os services importam dele). `SHIELD` reusa o
  exato clip-path do `player-card` (`polygon(0% 0%, 100% 0%, 100% 78%, 50% 100%, 0% 78%)`);
  `CIRCLE` é só `border-radius: 50%`; `HEXAGON` é um segundo clip-path novo. As 3 definições de
  clip-path estão **duplicadas** em três lugares (`team-crest-picker.component.scss`,
  `hub.page.scss`, e implicitamente o shield já existia em `player-card.component.scss`) —
  deliberado, são 2-3 linhas cada e Angular (view encapsulation por componente) não tem um jeito
  barato de compartilhar só regras CSS entre componentes sem criar um partial SCSS só pra isso.
- **Novo componente compartilhado `app-team-crest-picker`**
  (`src/app/shared/components/team-crest-picker/`): preview grande no formato escolhido (tapa nele
  = escolhe/troca a foto, igual o `photo-area` do `app-player-card`) + 3 "swatches" pequenos (um
  por formato) abaixo, tap num swatch troca o formato do preview grande. Registrado no
  `shared.module.ts`.
- **Fluxo de foto do escudo reaproveita exatamente o padrão de foto de perfil**
  (`profile.page.ts#pickPhoto/capturePhoto/uploadPhoto`): `ActionSheetController` (tirar
  foto/galeria/cancelar) → `@capacitor/camera` → preview local imediato (`photo.webPath`) → pede
  URL pré-assinada → `PUT` no S3 → troca preview pela URL final. **Reaproveita os DTOs genéricos já
  existentes** (`PhotoUploadUrlRequest`/`PhotoUploadUrlResponse`, que já não tinham nome
  "profile-específico") em vez de duplicar — só troca a pasta do S3 (`storageService.buildObjectKey("teams", "user-" + userId, ...)`,
  igual o padrão `"profiles"`/`"user-" + userId` do `ProfileService`, com o mesmo motivo: o time
  ainda não existe no momento do upload, só existe depois do `POST /teams`, então a key é
  organizada pelo usuário criador, não pelo `teamId`). Endpoint novo: `POST /teams/photo-upload-url`
  (mesmo contrato do `POST /profile/photo-upload-url`).
- **`TeamMembershipResponse`/`TeamMembership` (front)**: o campo `crest` (que nunca chegou a ser
  usado — sempre vinha `null`, era só um placeholder pro fallback de iniciais) foi **removido e
  substituído** por `crestUrl?`/`crestShape?`. `hub.page.html` agora mostra o escudo real (`<img>`
  recortado no `crestShape`, `crestOf()`/`initialsOf()` viraram só o fallback) quando o time tem
  `crestUrl`; sem foto, cai de volta no `app-avatar` com iniciais, igual antes.
- **Escudo é opcional na criação** — `CreateTeamRequest.crestUrl`/`crestShape` não têm
  `@NotBlank`/`@NotNull` no backend; o front sempre manda algum `crestShape` (default `'SHIELD'`
  no estado do componente, mesmo sem foto escolhida), mas `crestUrl` só vai se o upload tiver dado
  certo.
- **Mais campos no `Team`** (mesma sessão, logo em seguida): `foundationDate` (`LocalDate`,
  `@JsonFormat(dd/MM/yyyy)`, mesmo padrão do `birthDate` do perfil), `city`, `description`
  (curta, `VARCHAR(280)`) e `homeField` — todos opcionais, sem validação `@NotBlank` no
  `CreateTeamRequest`. **A migration `006-create-teams-table.sql` foi reescrita in-place** (não
  ganhou um `007`/`008` incremental) pra incluir essas colunas + `crest_url`/`crest_shape` direto
  na `CREATE TABLE` — decisão explícita do usuário porque a migration ainda não tinha rodado contra
  nenhum banco real; **daqui pra frente, qualquer mudança de schema em cima do que já foi
  aplicado precisa voltar a ser um changeset novo** (não editar um changeset já rodado — isso quebra
  o checksum do Liquibase). `memberships` continua em `007`.
- **Data de fundação reaproveita o padrão de data "leve" da tela de perfil**
  (`app-field` + `ion-popover`/`ion-datetime`, ver seção do perfil acima) — a lógica de máscara
  dd/mm/aaaa↔ISO que antes só existia em `profile.page.ts` foi **extraída** pra
  `src/app/shared/date-mask.util.ts` (`maskDateInput`/`ddMMyyyyToIso`/`isoToDdMMyyyy`) na hora de
  duplicar o mesmo padrão em `create-team.page.ts` — `profile.page.ts` foi refatorado pra usar o
  util também, sem mudança de comportamento.
- **Dois gotchas reais de CSS `clip-path` encontrados nessa sessão (ambos reportados pelo usuário
  via print, ambos com causa raiz confirmada por render isolado fora do app antes do fix, num
  HTML estático temporário — não versionado, só usado durante o diagnóstico):**
  1. **`box-shadow` não acompanha `clip-path`.** Sempre desenha no box retangular original do
     elemento. O anel de destaque do formato ativo em `app-team-crest-picker` usava `box-shadow`,
     criando um retângulo dourado visível por cima do escudo recortado. Fix: `filter:
     drop-shadow(...)` no lugar — `drop-shadow` respeita o alfa real da forma renderizada (mesma
     técnica já usada no brilho do `app-player-card` inteiro).
  2. **`border` não acompanha a diagonal do `clip-path`.** `border` só é desenhado nas bordas do
     retângulo original do elemento — na diagonal do `SHIELD`/`HEXAGON` (que corta por dentro
     desse retângulo) não sobra nenhum traço, só o preenchimento sem contorno, dando a impressão de
     "escudo cortado" bem na base (exatamente o que o usuário reportou — via prints
     `docs/img.png`/`docs/img_1.png` inicialmente sem detalhe suficiente, depois confirmado com um
     crop bem próximo mostrando a borda simplesmente parando no fim do lado reto). O preview grande
     (`.crest-preview-wrap`) nunca teve esse problema porque não usa `border` — usa duas camadas
     **irmãs** (não aninhadas, ambas `position: absolute` dentro do mesmo wrapper `relative`):
     `.crest-border` (cor sólida dourada, `clip-path`, `inset: 0`) por baixo + `.crest-preview`
     (fundo escuro próprio + a foto dentro, mesmo `clip-path`, `inset` de alguns px) por cima —
     o "anel" que sobra entre as duas acompanha o contorno inteiro, incluindo diagonais. Fix:
     `.shape-option` (`team-crest-picker.component.scss`, usa `::after` como a camada de cima já
     que é um `<button>` sem filho) e `.crest-thumb` (`hub.page.scss`) passaram a usar a mesma
     técnica de duas camadas em vez de `border`.
  **Regra geral pra qualquer elemento futuro com `clip-path` não-retangular/não-circular
  (`border-radius`)**: nunca usar `border` nem `box-shadow` pra contorno/destaque — sempre a
  técnica de duas camadas (cor sólida atrás, conteúdo recuado na frente, mesmo `clip-path` nas
  duas) ou `filter: drop-shadow`.
  - **Cuidado extra pra camadas que carregam imagem** (fotos de usuário, que podem falhar/demorar
    a carregar): a camada de cima **precisa ter fundo sólido próprio** por trás da `<img>` (não só
    a `<img>` sozinha inset sobre a camada dourada) — senão, foto quebrada/lenta = dourado sólido
    tomando conta do escudo inteiro (bug real, reportado pelo usuário logo depois do fix acima —
    a primeira versão do fix tinha virado só a `<img>` inset direto sobre o fundo dourado, sem
    fundo escuro próprio por trás). A camada de cima sempre precisa de 3 níveis: wrapper
    (`relative`, sem estilo visual) → camada dourada (`absolute inset:0`) + camada de conteúdo
    (fundo `--p-card2` PRÓPRIO, `absolute inset` de alguns px, `overflow:hidden`, contém a
    `<img>` **sem** `clip-path` próprio — o `clip-path` da camada já corta o conteúdo inteiro,
    incluindo a imagem, não precisa repetir na tag `<img>`).
- **Extraído `app-crest-badge` compartilhado** (`src/app/shared/components/crest-badge/`,
  registrado no `shared.module.ts`) depois que a mesma estrutura de 3 níveis acima ia ser
  duplicada pela **terceira vez** (hub, agora busca de times) — vira o ponto de virada certo pra
  extrair (não é abstração prematura, é a mesma lógica não-trivial com gotcha documentado se
  repetindo). Inputs: `crestUrl`, `crestShape`, `size`, `fallbackLabel` (iniciais quando não tem
  foto), `avatarVariant` (repassado pro `app-avatar` do fallback). `hub.page.html` foi refatorado
  pra usar esse componente em vez do bloco de 3 divs inline (CSS/método `crestShapeClass()`
  correspondentes foram removidos do hub). **O preview grande do `app-team-crest-picker`
  continua separado** (não usa `app-crest-badge`) — ali tem preocupações a mais que não cabem num
  badge só-leitura: seleção interativa de formato, badge de câmera pra trocar foto, brilho
  `drop-shadow` do card inteiro.
- **Recorte do `SHIELD`/`HEXAGON` do escudo do time é o mesmo do `app-player-card` (78%/25%),
  DE PROPÓSITO.** Chegamos a tentar suavizar o taper (88%/12%) achando que o corte agressivo comia
  parte da foto/logo — mas essa não era a causa raiz real (era o bug de `border` acima) e, em
  elementos pequenos (42px/36px), esse recorte quase imperceptível fazia a forma parecer quebrada
  (quase um retângulo com uma pontinha), pior do que o original. Revertido. Recorte perceptível o
  bastante pra formato ser reconhecível > preservar cada pixel da foto — cortar parte de uma
  foto/logo dentro de um formato escolhido é comportamento esperado desse tipo de picker (mesma
  lógica de crop de avatar circular), não é bug.
- **`create-team.page.ts` ganhou `ionViewWillEnter` com reset de estado** (mesmo motivo do
  `IonicRouteStrategy` documentado na seção da tela de perfil — a página é cacheada pelo router, não
  recriada) — sem isso, criar um time, voltar pro hub e entrar de novo em "Criar time" reapareceria
  com os campos da tentativa anterior ainda preenchidos.

### Buscar/entrar em time — `/join-team` (sessão 2026-08-06)

Segunda fatia do fluxo de "entrar em time" (a primeira foi só o botão placeholder no hub). Busca
paginada com infinite scroll + solicitação de entrada — a **aprovação** (quem decide
mensalista/avulso) continua fora de escopo, é a próxima fatia.

- **Backend**: `GET /teams/search?query=&page=&size=` — busca por `name` OU `city` OU
  `homeField` (`ContainingIgnoreCase`, case-insensitive, paginado via `Pageable`/`Page<Team>` do
  Spring Data, mapeado pra um DTO próprio em vez de serializar `Page` direto). Query em branco
  responde página vazia sem nem tocar o banco (`query.isBlank()` guard em `TeamService`) — o
  gate de "precisa digitar algo" é reforçado nos dois lados, não só no front. Cada resultado
  (`TeamSearchResult`) traz `crestUrl`/`crestShape`, `city`, `homeField`, `memberCount` (só
  membros `ACTIVE`, contados em **lote** por uma query `GROUP BY` — `MembershipRepository
  .countByTeamIdInAndStatus` + projection `TeamMemberCount` — pra não fazer N+1 uma query de
  contagem por time da página) e `myMembershipStatus` (o vínculo do usuário logado com aquele
  time, se existir — resolvido comparando com `membershipRepository.findByUserId(userId)` já
  carregado uma vez, não uma query por resultado). `POST /teams/{teamId}/membership-requests` cria
  `Membership(role=PLAYER, status=PENDING, type=null)` — `type` fica **null de propósito**, só é
  decidido na aprovação (que ainda não existe) — por isso `type` em `memberships` não é
  `NOT NULL` (`007-create-memberships-table.sql` — a coluna nasceu nullable direto na criação da
  tabela; chegou a existir um incremento `008` separado só pra isso, mas foi fundido de volta pra
  dentro do `007` porque a migration ainda não tinha rodado contra nenhum banco real quando isso
  foi pedido — **daqui pra frente, qualquer mudança em cima do que já rodou precisa ser um
  changeset novo**, não dá mais pra editar `006`/`007` em place). Bloqueia duplicata
  via `existsByUserIdAndTeamId` antes de inserir (`DuplicateMembershipRequestException`, 409
  `DUPLICATE_MEMBERSHIP_REQUEST`) — **inclusive contra uma filiação `INACTIVE` antiga**, ou seja
  reativar um vínculo antigo não é suportado ainda (bloqueia igual duplicata nova), fica pra
  quando o fluxo de aprovação/remoção existir de verdade.
- **Front**: campo de busca com **debounce de 1.2s** (`debounceTime` + `distinctUntilChanged` +
  `switchMap`, RxJS) — `switchMap` é o que garante que uma busca mais nova cancela a anterior que
  ainda não respondeu (sem isso, uma resposta antiga lenta podia sobrescrever um resultado mais
  novo). Campo vazio não dispara nada (`onQueryInput` já corta antes de chegar no `Subject`).
  Resultados carregam via `ion-infinite-scroll` (`(ionInfinite)="loadMore($event)"`,
  `[disabled]="!canLoadMore"` — só habilitado depois de já ter buscado algo E ainda ter próxima
  página), 15 por página. Solicitar entrada (`requestToJoinTeam`) atualiza o card localmente
  (`myMembershipStatus = 'PENDING'`) sem precisar re-buscar — e como o hub já lê
  `GET /teams/my-memberships` (que traz PENDING também) toda vez que reabre, o pedido novo aparece
  lá sozinho.
- Botão de ação por resultado: sem vínculo → botão circular dourado (ícone `person-add-outline`,
  chama `requestToJoin`); `PENDING`/`ACTIVE` → pill de status (mesmo estilo `pending-pill` do hub),
  sem interação — evita pedido duplicado por engano batendo em algo que já mostra "PENDENTE"/
  "MEMBRO".

### Próximo passo combinado

Módulo `auth` do `prorrogacao-api` implementado (2026-08-02), incluindo `/auth/logout`. Módulo
`profile` (`GET/PUT /profile`) implementado; infra de upload de foto (S3 real,
`POST /profile/photo-upload-url`) **ainda não** — ver seção da tela de perfil acima. Módulo `time`:
criar time, buscar/solicitar entrada (`GET /teams/search`, `POST /teams/{id}/membership-requests`)
implementados — ver seções acima. **Ainda falta**: aprovação de membership pendente (tela pro
presidente ver quem solicitou entrada em `PENDING` e decidir `role`/`type`
mensalista-ou-avulso/`ACTIVE` — é o que faz `Membership.type` deixar de ser `null`), reativação de
filiação `INACTIVE` (hoje bloqueada como duplicata, sem fluxo próprio), e o filtro
`X-Active-Team`/segundo `OncePerRequestFilter` de autorização por time (só passa a ser necessário
quando existir algum endpoint escopado a um time específico — elenco, financeiro, eventos etc. —
nenhum desses módulos existe ainda). Quando `home.page.ts`/`.html` deixar de ser mock fixo, vai
precisar receber o `teamId` vindo do hub (rota tipo `/home/:teamId` ou guardar o time ativo em
algum serviço/estado) — `hub.page.ts#openTeam()` hoje sempre manda pra `/home` sem `teamId`
nenhum.
