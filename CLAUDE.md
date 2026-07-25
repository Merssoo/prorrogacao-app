# Prorrogação

Sistema de gestão de times de futebol de várzea. Stack: Java 21 + Spring Boot 3 · PostgreSQL · Angular + Ionic (Capacitor).

Fontes de verdade em `/docs`:
- `prorrogacao-documentacao-tecnica.md` — domínio, regras de negócio, ER, endpoints REST rascunho.
- `prorrogacao-app-prototipo.jsx` — protótipo visual (mockup, não produção).

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

## Estado atual: front de auth implementado (2026-07-24), backend ainda não existe

O front (`prorrogacao-app`) já tem toda a fiação de auth abaixo pronta e buildando (`ng build`
passou limpo). O `prorrogacao-api` continua só o esqueleto do Spring Initializr (nenhuma entidade,
nenhum endpoint) — ou seja, o front chama endpoints que **ainda não existem no backend**. Antes de
assumir que algo mudou, checar se esses arquivos ainda existem e bater com a descrição:

- `src/app/services/secure-storage.service.ts` — abstração de storage (ver seção acima).
- `src/app/services/api.service.ts` — wrapper fino de `HttpClient` com `environment.apiUrl`.
- `src/app/services/auth.service.ts` — login/cadastro/verificarEmail/reenviarCodigo/refresh/logout.
- `src/app/interceptors/auth.interceptor.ts` — anexa Bearer token, refresh proativo/reativo.
- `src/app/guards/auth.guard.ts` — só autenticação, aplicado em `app-routing.module.ts` nas rotas
  `perfil`, `home`, `criar-evento`, `evento`, `sorteio`, `notas`, `votacao`, `financeiro`.
- `src/app/shared/http-error.util.ts` — extrai `error.error.message` da resposta HTTP com fallback.
- `app.module.ts` — `provideHttpClient(withInterceptors([authInterceptor]))` +
  `provideAppInitializer` chamando `AuthService.initialize()` (restaura/renova sessão no boot —
  essencial na web, onde o access token não sobrevive a um reload).
- `environment.ts` / `environment.prod.ts` — `apiUrl` (`http://localhost:8080` em dev; o valor de
  prod é só um placeholder, ajustar quando existir domínio real).
- Páginas `login`, `cadastro`, `codigo` já chamam o `AuthService` de verdade (antes só navegavam
  entre telas sem chamar API nenhuma).

### Contrato de API assumido pelo front (rascunho — implementar no `prorrogacao-api` a seguir)

Esses formatos foram inventados pelo front na ausência de um backend — **não são spec fechada**,
só o que precisa bater quando o módulo `auth` do Spring Boot for implementado. Ajustar aqui se o
contrato mudar durante a implementação do backend.

| Endpoint | Body | Resposta 2xx |
|---|---|---|
| `POST /auth/cadastro` | `{ nome, email, senha }` | `{ mensagem? }` |
| `POST /auth/verificar-email` | `{ email, codigo }` | `{ mensagem? }` |
| `POST /auth/reenviar-codigo` | `{ email }` | `{ mensagem? }` |
| `POST /auth/login` | `{ email, senha }` | `{ accessToken, refreshToken, perfilCriado }` |
| `POST /auth/refresh-token` | `{ refreshToken }` | `{ accessToken, refreshToken }` |

- Erros: front lê `error.error.message` (corpo JSON com campo `message`) pra mostrar no toast; sem
  esse campo cai num texto genérico fixo por tela.
- `perfilCriado` no login decide se o front manda o usuário pra `/perfil` (criar perfil de atleta)
  ou `/home`.
- Claims do access token (JWT) que o front decodifica: `sub` (id do usuário), `nome`, `email`,
  `exp`, `iat` — nada de papel/role embutido (ver "Decisões já tomadas", item 3).
- `/auth/refresh-token` **rotaciona** o refresh token a cada uso (retorna um novo par) — combina com
  a decisão de multi-device: só o refresh token usado é substituído, os outros devices do mesmo
  usuário continuam válidos.

### Próximo passo combinado

Implementar o módulo `auth` no `prorrogacao-api` (Spring Boot) pra esses endpoints passarem a
responder de verdade — usar o padrão do BeSeen como referência (seção acima), com as adaptações já
decididas (multi-device, lockout + rate limit na v1) e a estrutura de camadas da seção 6 do doc
técnico (`config`, `auth`, `usuario`, ...).
