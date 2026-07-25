import React, { useState } from "react";
import {
  Menu, MapPin, Check, Users, Wallet, ClipboardList, Grid3x3, Home,
  CalendarDays, ChevronRight, ChevronLeft, Bell, Mail, Lock, User as UserIcon,
  Shield, Star, Shuffle, Trophy, Plus, Vote, Crown, DollarSign, AlertCircle,
} from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────
const C = {
  pitch: "#0E1410", card: "#18211B", card2: "#1F2A22", line: "#2C3A30",
  chalk: "#EDF1EA", muted: "#8A968C", gold: "#F5C542", grass: "#5FCB7E",
  alert: "#F26B5E", ink: "#1A1206",
};

const SCREENS = [
  ["login", "Login"], ["cadastro", "Cadastro"], ["codigo", "Código"],
  ["perfil", "Criar perfil"], ["home", "Home"], ["criarEvento", "Criar evento"],
  ["evento", "Presença"], ["sorteio", "Sorteio"], ["notas", "Notas"],
  ["votacao", "Votação"], ["financeiro", "Financeiro"],
];

export default function App() {
  const [screen, setScreen] = useState("login");
  const go = (s) => setScreen(s);
  const props = { go };

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: "radial-gradient(120% 80% at 50% -10%, #14201A 0%, #0A0F0C 60%, #080B09 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 16px 40px", fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');
        .bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: .02em; }
        .tap { transition: transform .12s ease, background .2s, box-shadow .2s, border-color .2s; -webkit-tap-highlight-color: transparent; }
        .tap:active { transform: scale(.97); }
        .noscroll::-webkit-scrollbar { display: none; }
        input { outline: none; }
        @media (prefers-reduced-motion: reduce){ .tap{transition:none;} }
      `}</style>

      {/* screen picker (fora do app, só pra demo) */}
      <div className="noscroll" style={{
        display: "flex", gap: 7, overflowX: "auto", maxWidth: 430,
        width: "100%", marginBottom: 16, paddingBottom: 4,
      }}>
        {SCREENS.map(([id, label]) => (
          <button key={id} onClick={() => go(id)} className="tap" style={{
            flexShrink: 0, padding: "7px 13px", borderRadius: 999, cursor: "pointer",
            fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
            background: screen === id ? C.gold : C.card,
            color: screen === id ? C.ink : C.muted,
            border: `1px solid ${screen === id ? C.gold : C.line}`,
          }}>{label}</button>
        ))}
      </div>

      <Phone>
        {screen === "login" && <Login {...props} />}
        {screen === "cadastro" && <Cadastro {...props} />}
        {screen === "codigo" && <Codigo {...props} />}
        {screen === "perfil" && <Perfil {...props} />}
        {screen === "home" && <HomeScreen {...props} />}
        {screen === "criarEvento" && <CriarEvento {...props} />}
        {screen === "evento" && <Evento {...props} />}
        {screen === "sorteio" && <Sorteio {...props} />}
        {screen === "notas" && <Notas {...props} />}
        {screen === "votacao" && <Votacao {...props} />}
        {screen === "financeiro" && <Financeiro {...props} />}
      </Phone>
    </div>
  );
}

// ── Phone frame ───────────────────────────────────────────────
function Phone({ children }) {
  return (
    <div style={{
      width: 390, maxWidth: "100%", height: 800, background: C.pitch,
      borderRadius: 44, border: "1px solid #223028",
      boxShadow: "0 40px 90px -20px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.04)",
      overflow: "hidden", position: "relative", display: "flex", flexDirection: "column",
    }}>
      <div style={{
        height: 40, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 26px", fontSize: 13, fontWeight: 600, color: C.chalk, flexShrink: 0,
      }}>
        <span>15:42</span><span style={{ letterSpacing: 1, opacity: .9 }}>••• ▽ 84%</span>
      </div>
      {children}
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────
function Body({ children, pad = "0 22px 24px" }) {
  return <div className="noscroll" style={{ flex: 1, overflowY: "auto", padding: pad }}>{children}</div>;
}
function TopBar({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 18px 12px", flexShrink: 0 }}>
      {onBack && (
        <div className="tap" onClick={onBack} style={{
          width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center",
          background: C.card, border: `1px solid ${C.line}`, cursor: "pointer",
        }}><ChevronLeft size={19} color={C.chalk} /></div>
      )}
      <div className="bebas" style={{ fontSize: 24, color: C.chalk }}>{title}</div>
    </div>
  );
}
function Field({ icon: Icon, placeholder, type = "text", value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 11, background: C.card,
      border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 15px", marginBottom: 12,
    }}>
      {Icon && <Icon size={18} color={C.muted} />}
      <input defaultValue={value} type={type} placeholder={placeholder} style={{
        border: "none", background: "transparent", color: C.chalk, fontSize: 15,
        width: "100%", fontFamily: "inherit",
      }} />
    </div>
  );
}
function Btn({ children, onClick, variant = "gold", icon: Icon }) {
  const styles = {
    gold: { background: C.gold, color: C.ink, border: "none", boxShadow: "0 8px 20px -6px rgba(245,197,66,.5)" },
    ghost: { background: C.card, color: C.chalk, border: `1px solid ${C.line}` },
    grass: { background: C.card2, color: C.grass, border: `1px solid ${C.grass}` },
  }[variant];
  return (
    <button className="tap bebas" onClick={onClick} style={{
      width: "100%", borderRadius: 14, padding: "15px", cursor: "pointer",
      fontSize: 20, letterSpacing: 1.2, display: "flex", alignItems: "center",
      justifyContent: "center", gap: 9, ...styles,
    }}>{Icon && <Icon size={18} strokeWidth={2.6} />}{children}</button>
  );
}
function Avatar({ label, size = 32, gold, grass }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2, display: "grid", placeItems: "center",
      fontSize: size * .34, fontWeight: 700, flexShrink: 0,
      background: gold ? C.gold : grass ? C.grass : C.card2,
      color: gold || grass ? C.ink : C.chalk,
      border: `2px solid ${C.pitch}`,
    }}>{label}</div>
  );
}
function RoleBadge({ role }) {
  const map = {
    PRESIDENTE: { c: C.gold, i: Crown }, TESOUREIRO: { c: C.grass, i: DollarSign },
    CONSELHEIRO: { c: "#8FB4FF", i: Shield }, JOGADOR: { c: C.muted, i: UserIcon },
  }[role];
  const I = map.i;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9.5, fontWeight: 700,
      letterSpacing: .8, color: map.c, background: `${map.c}1A`, border: `1px solid ${map.c}44`,
      padding: "3px 7px", borderRadius: 6,
    }}><I size={10} />{role}</span>
  );
}
function Eyebrow({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: 2.5, color: C.muted, fontWeight: 700, margin: "6px 2px 12px" }}>{children}</div>;
}

// ══════════════════════════════════════════════════════════════
// 1. LOGIN
function Login({ go }) {
  return (
    <Body pad="0 26px 24px">
      <div style={{ textAlign: "center", margin: "34px 0 30px" }}>
        <div style={{
          width: 76, height: 76, borderRadius: 22, margin: "0 auto 16px",
          display: "grid", placeItems: "center",
          background: "linear-gradient(135deg,#F5C542,#E0A81E)",
          boxShadow: "0 10px 26px -8px rgba(245,197,66,.6)",
        }}><span className="bebas" style={{ fontSize: 34, color: C.ink }}>P</span></div>
        <div className="bebas" style={{ fontSize: 40, color: C.chalk, lineHeight: .9 }}>PRORROGAÇÃO</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Gestão do seu time de várzea</div>
      </div>
      <Field icon={Mail} placeholder="E-mail" type="email" />
      <Field icon={Lock} placeholder="Senha" type="password" />
      <div style={{ textAlign: "right", marginBottom: 18 }}>
        <span style={{ color: C.muted, fontSize: 12.5 }}>Esqueci minha senha</span>
      </div>
      <Btn onClick={() => go("home")} icon={Check}>ENTRAR</Btn>
      <div style={{ textAlign: "center", marginTop: 22, color: C.muted, fontSize: 13.5 }}>
        Não tem conta?{" "}
        <span className="tap" onClick={() => go("cadastro")} style={{ color: C.gold, fontWeight: 700, cursor: "pointer" }}>Criar conta</span>
      </div>
    </Body>
  );
}

// 2. CADASTRO
function Cadastro({ go }) {
  return (
    <>
      <TopBar title="CRIAR CONTA" onBack={() => go("login")} />
      <Body>
        <div style={{ color: C.muted, fontSize: 13.5, marginBottom: 20, lineHeight: 1.5 }}>
          Preencha seus dados. Vamos enviar um código de confirmação para seu e-mail.
        </div>
        <Field icon={UserIcon} placeholder="Nome completo" />
        <Field icon={Mail} placeholder="E-mail" type="email" />
        <Field icon={Lock} placeholder="Senha" type="password" />
        <Field icon={Lock} placeholder="Confirmar senha" type="password" />
        <div style={{ marginTop: 8 }}>
          <Btn onClick={() => go("codigo")} icon={ChevronRight}>CONTINUAR</Btn>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, color: C.muted, fontSize: 13.5 }}>
          Já tem conta?{" "}
          <span className="tap" onClick={() => go("login")} style={{ color: C.gold, fontWeight: 700, cursor: "pointer" }}>Entrar</span>
        </div>
      </Body>
    </>
  );
}

// 3. CONFIRMAR CÓDIGO
function Codigo({ go }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const set = (i, v) => setDigits((d) => d.map((x, j) => (j === i ? v.slice(-1) : x)));
  return (
    <>
      <TopBar title="CONFIRMAR E-MAIL" onBack={() => go("cadastro")} />
      <Body>
        <div style={{ textAlign: "center", margin: "24px 0 26px" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: "0 auto 18px", display: "grid",
            placeItems: "center", background: C.card, border: `1px solid ${C.line}`,
          }}><Mail size={26} color={C.gold} /></div>
          <div style={{ color: C.chalk, fontSize: 15, lineHeight: 1.5 }}>
            Enviamos um código de 6 dígitos para<br />
            <b style={{ color: C.gold }}>jogador@email.com</b>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "center", marginBottom: 24 }}>
          {digits.map((d, i) => (
            <input key={i} value={d} onChange={(e) => set(i, e.target.value)} inputMode="numeric" maxLength={1}
              style={{
                width: 46, height: 56, textAlign: "center", fontSize: 24, fontWeight: 700,
                borderRadius: 12, background: C.card, color: C.chalk,
                border: `1px solid ${d ? C.gold : C.line}`, fontFamily: "inherit",
              }} />
          ))}
        </div>
        <Btn onClick={() => go("login")} icon={Check}>CONFIRMAR</Btn>
        <div style={{ textAlign: "center", marginTop: 20, color: C.muted, fontSize: 13 }}>
          Reenviar código em <b style={{ color: C.chalk }}>00:42</b>
        </div>
      </Body>
    </>
  );
}

// 4. CRIAR PERFIL
const POS = ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Atacante"];
const PE = ["Direito", "Esquerdo", "Ambidestro"];
function Perfil({ go }) {
  const [pos, setPos] = useState("Meia");
  const [pe, setPe] = useState("Direito");
  return (
    <>
      <TopBar title="SEU PERFIL" />
      <Body>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div className="tap" style={{
            width: 84, height: 84, borderRadius: 42, margin: "0 auto 10px", display: "grid",
            placeItems: "center", background: C.card2, border: `2px dashed ${C.line}`, cursor: "pointer",
          }}><Plus size={26} color={C.muted} /></div>
          <span style={{ color: C.muted, fontSize: 12.5 }}>Adicionar foto</span>
        </div>
        <Field icon={UserIcon} placeholder="Apelido no time" value="Caco" />
        <Eyebrow>POSIÇÃO PRINCIPAL</Eyebrow>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {POS.map((p) => (
            <Chip key={p} active={pos === p} onClick={() => setPos(p)}>{p}</Chip>
          ))}
        </div>
        <Eyebrow>PÉ DOMINANTE</Eyebrow>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {PE.map((p) => (
            <Chip key={p} active={pe === p} onClick={() => setPe(p)} grow>{p}</Chip>
          ))}
        </div>
        <Field icon={ClipboardList} placeholder="Número da camisa" value="10" />
        <div style={{ marginTop: 8 }}>
          <Btn onClick={() => go("home")} icon={Check}>CONCLUIR</Btn>
        </div>
      </Body>
    </>
  );
}
function Chip({ children, active, onClick, grow }) {
  return (
    <button className="tap" onClick={onClick} style={{
      flex: grow ? 1 : "unset", padding: "10px 15px", borderRadius: 11, cursor: "pointer",
      fontSize: 13.5, fontWeight: 600,
      background: active ? C.gold : C.card, color: active ? C.ink : C.chalk,
      border: `1px solid ${active ? C.gold : C.line}`,
    }}>{children}</button>
  );
}

// 5. HOME
function HomeScreen({ go }) {
  const [ok, setOk] = useState(false);
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 20px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div className="tap" style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: C.card, border: `1px solid ${C.line}` }}>
            <Menu size={18} color={C.chalk} />
          </div>
          <div>
            <div className="bebas" style={{ fontSize: 22, color: C.chalk, lineHeight: 1 }}>UNIÃO DA VILA F.C.</div>
            <div style={{ marginTop: 4 }}><RoleBadge role="PRESIDENTE" /></div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div className="tap" style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: C.card, border: `1px solid ${C.line}` }}>
            <Bell size={17} color={C.chalk} />
          </div>
          <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, background: C.gold, border: `2px solid ${C.card}` }} />
        </div>
      </div>

      <Body pad="0 20px 16px">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Eyebrow>PRÓXIMO JOGO</Eyebrow>
          <span className="tap" onClick={() => go("criarEvento")} style={{ color: C.gold, fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
            <Plus size={13} /> Novo evento
          </span>
        </div>

        <div className="tap" onClick={() => go("evento")} style={{
          position: "relative", borderRadius: 22, padding: "20px 20px 22px", cursor: "pointer",
          background: "linear-gradient(180deg,#1D2A22,#141D18)", border: `1px solid ${C.line}`, overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -70, left: "50%", transform: "translateX(-50%)", width: 260, height: 160, background: "radial-gradient(closest-side, rgba(245,197,66,.20), transparent)" }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            <CalendarDays size={13} color={C.gold} />
            <span className="bebas" style={{ color: C.gold, fontSize: 17, letterSpacing: 1 }}>SÁB · 26 JUL · 15H00</span>
          </div>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
            <TeamCrest crest="UV" name="União da Vila" home />
            <span className="bebas" style={{ fontSize: 28, color: C.muted }}>VS</span>
            <TeamCrest crest="RV" name="Real Várzea" />
          </div>
          <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 6, marginTop: 16, color: C.muted, fontSize: 13 }}>
            <MapPin size={13} /> Campo do Zé Pretão
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn variant={ok ? "grass" : "gold"} icon={Check} onClick={(e) => { e.stopPropagation?.(); setOk(!ok); }}>
              {ok ? "PRESENÇA CONFIRMADA" : "CONFIRMAR PRESENÇA"}
            </Btn>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 2px 12px" }}>
          <div style={{ display: "flex" }}>
            {["MG", "TÔ", "JR", "PH", "CA"].map((n, i) => (
              <div key={i} style={{ marginLeft: i ? -9 : 0 }}><Avatar label={n} size={30} /></div>
            ))}
            <div style={{ marginLeft: -9 }}><Avatar label="+11" size={30} grass /></div>
          </div>
          <div>
            <span className="bebas" style={{ color: C.grass, fontSize: 20 }}>16</span>
            <span style={{ color: C.muted, fontSize: 12 }}>/20 vagas</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Tile icon={Users} label="Elenco" sub="18 atletas" />
          <Tile icon={Star} label="Notas" sub="Avaliar time" onClick={() => go("notas")} />
          <Tile icon={Vote} label="Votação" sub="Craque do jogo" onClick={() => go("votacao")} />
          <Tile icon={Shuffle} label="Sortear" sub="Times do racha" onClick={() => go("sorteio")} />
        </div>

        <div className="tap" onClick={() => go("financeiro")} style={{
          marginTop: 14, borderRadius: 16, padding: "14px 16px", background: C.card,
          border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.alert}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: C.alert, fontWeight: 700, marginBottom: 3 }}>MENSALIDADE</div>
            <div style={{ color: C.chalk, fontSize: 14, fontWeight: 600 }}>4 atletas em atraso · R$ 240</div>
          </div>
          <ChevronRight size={20} color={C.muted} />
        </div>
      </Body>

      <BottomNav active="Início" />
    </>
  );
}
function TeamCrest({ crest, name, home }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 54, height: 54, borderRadius: 15, margin: "0 auto 8px", display: "grid", placeItems: "center",
        background: home ? "linear-gradient(135deg,#F5C542,#E0A81E)" : C.card2,
        border: home ? "none" : `1px solid ${C.line}`,
      }}><span className="bebas" style={{ fontSize: 24, color: home ? C.ink : C.chalk }}>{crest}</span></div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.chalk }}>{name}</div>
    </div>
  );
}
function Tile({ icon: Icon, label, sub, onClick }) {
  return (
    <div className="tap" onClick={onClick} style={{ borderRadius: 16, padding: "15px 16px", background: C.card, border: `1px solid ${C.line}`, cursor: "pointer" }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: C.card2, display: "grid", placeItems: "center", marginBottom: 12 }}>
        <Icon size={17} color={C.gold} />
      </div>
      <div style={{ color: C.chalk, fontSize: 15, fontWeight: 600 }}>{label}</div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{sub}</div>
    </div>
  );
}
function BottomNav({ active }) {
  const items = [["Início", Home], ["Elenco", Users], ["Jogos", CalendarDays], ["Caixa", Wallet]];
  return (
    <div style={{ flexShrink: 0, height: 66, background: "#111814", borderTop: `1px solid ${C.line}`, display: "grid", gridTemplateColumns: "repeat(4,1fr)", paddingBottom: 4 }}>
      {items.map(([l, I]) => {
        const on = l === active;
        return (
          <div key={l} className="tap" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}>
            <I size={20} color={on ? C.gold : C.muted} strokeWidth={on ? 2.4 : 2} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500, color: on ? C.gold : C.muted }}>{l}</span>
          </div>
        );
      })}
    </div>
  );
}

// 6. CRIAR EVENTO
function CriarEvento({ go }) {
  const [tipo, setTipo] = useState("INTERNO");
  const interno = tipo === "INTERNO";
  return (
    <>
      <TopBar title="NOVO EVENTO" onBack={() => go("home")} />
      <Body>
        <Eyebrow>TIPO DE JOGO</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 6 }}>
          <TypeCard active={interno} onClick={() => setTipo("INTERNO")} icon={Shuffle}
            title="Contra o próprio time" sub="Racha interno · times sorteados" />
          <TypeCard active={!interno} onClick={() => setTipo("EXTERNO")} icon={Trophy}
            title="Contra time de fora" sub="Jogo oficial · titulares + reservas" />
        </div>

        <div style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 14,
          padding: "13px 15px", margin: "10px 0 18px", display: "flex", gap: 10,
          alignItems: "flex-start",
        }}>
          <AlertCircle size={16} color={C.gold} style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.5 }}>
            {interno
              ? "Racha interno abre mais vagas (sugestão: 20) para formar dois times. O sorteio balanceia por posição e nota."
              : "Jogo externo abre menos vagas (sugestão: 16) — só quem entra na escalação e no banco."}
          </div>
        </div>

        {interno
          ? <Field icon={ClipboardList} placeholder="Título do racha" value="Racha de sábado" />
          : <Field icon={Trophy} placeholder="Time adversário" value="Real Várzea" />}
        <Field icon={MapPin} placeholder="Local" value="Campo do Zé Pretão" />
        <Field icon={CalendarDays} placeholder="Data e hora" value="26/07 · 15:00" />
        <Field icon={Bell} placeholder="Prazo p/ confirmar" value="25/07 · 20:00" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
          <span style={{ color: C.chalk, fontSize: 14.5, fontWeight: 600 }}>Vagas</span>
          <span className="bebas" style={{ fontSize: 26, color: C.gold }}>{interno ? 20 : 16}</span>
        </div>

        <Btn onClick={() => go("evento")} icon={Check}>CRIAR EVENTO</Btn>
      </Body>
    </>
  );
}
function TypeCard({ active, onClick, icon: Icon, title, sub }) {
  return (
    <div className="tap" onClick={onClick} style={{
      borderRadius: 16, padding: "15px 14px", cursor: "pointer",
      background: active ? "linear-gradient(180deg,#22301F,#18211A)" : C.card,
      border: `1px solid ${active ? C.gold : C.line}`,
    }}>
      <Icon size={20} color={active ? C.gold : C.muted} />
      <div style={{ color: C.chalk, fontSize: 14, fontWeight: 700, marginTop: 10, lineHeight: 1.2 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

// 7. EVENTO / PRESENÇA
function Evento({ go }) {
  const confirmados = [["Marcão", "GOL", "MG"], ["Tota", "ZAG", "TÔ"], ["Dedé", "LAT", "DÊ"], ["Júnior", "VOL", "JR"], ["PH", "MEI", "PH"], ["Caco", "MEI", "CA"], ["Léo", "ATA", "LÉ"], ["Bill", "ATA", "BI"]];
  const duvida = [["Rafa", "ZAG", "RA"], ["Nando", "MEI", "NA"], ["Kadu", "ATA", "KA"]];
  return (
    <>
      <TopBar title="DETALHES DO JOGO" onBack={() => go("home")} />
      <Body>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${C.grass}1A`, border: `1px solid ${C.grass}44`, color: C.grass, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, marginBottom: 14 }}>
          <Shuffle size={12} /> RACHA INTERNO
        </div>
        <div className="bebas" style={{ fontSize: 26, color: C.chalk, lineHeight: 1 }}>RACHA DE SÁBADO</div>
        <div style={{ color: C.muted, fontSize: 13, margin: "8px 0 18px", display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
          <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><CalendarDays size={13} /> Sáb · 26 jul · 15h</span>
          <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><MapPin size={13} /> Campo do Zé Pretão</span>
        </div>

        {/* barra de vagas */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: C.chalk, fontSize: 13.5, fontWeight: 600 }}>Vagas preenchidas</span>
            <span className="bebas" style={{ color: C.gold, fontSize: 18 }}>16<span style={{ color: C.muted }}>/20</span></span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: C.card2, overflow: "hidden" }}>
            <div style={{ width: "80%", height: "100%", background: `linear-gradient(90deg,${C.gold},${C.grass})` }} />
          </div>
        </div>

        <Btn variant="grass" icon={Check}>VOCÊ CONFIRMOU PRESENÇA</Btn>
        <div style={{ height: 12 }} />
        <div className="tap" onClick={() => go("sorteio")}><Btn variant="gold" icon={Shuffle}>SORTEAR TIMES</Btn></div>

        <PlayerGroup title="CONFIRMADOS" count={confirmados.length} color={C.grass} players={confirmados} />
        <PlayerGroup title="DÚVIDA" count={duvida.length} color={C.gold} players={duvida} />
      </Body>
    </>
  );
}
function PlayerGroup({ title, count, color, players }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
        <span style={{ fontSize: 11, letterSpacing: 1.5, color: C.muted, fontWeight: 700 }}>{title} · {count}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {players.map(([nome, pos, ini], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 13px" }}>
            <Avatar label={ini} size={34} />
            <span style={{ color: C.chalk, fontSize: 14.5, fontWeight: 600, flex: 1 }}>{nome}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .5, color: C.muted, background: C.card2, padding: "4px 8px", borderRadius: 6 }}>{pos}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 8. SORTEIO
function Sorteio({ go }) {
  const timeA = { nome: "TIME A", cor: C.gold, soma: 51, players: [["Marcão", "GOL", 8], ["Tota", "ZAG", 7], ["Dedé", "LAT", 6], ["Júnior", "VOL", 8], ["Caco", "MEI", 9], ["Léo", "ATA", 7], ["Rafa", "ZAG", 6]] };
  const timeB = { nome: "TIME B", cor: "#8FB4FF", soma: 50, players: [["Zé Luiz", "GOL", 7], ["Betão", "ZAG", 8], ["Nino", "LAT", 6], ["PH", "VOL", 7], ["Nando", "MEI", 8], ["Bill", "ATA", 8], ["Kadu", "ATA", 6]] };
  return (
    <>
      <TopBar title="TIMES SORTEADOS" onBack={() => go("evento")} />
      <Body>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 15px", marginBottom: 18, display: "flex", gap: 10 }}>
          <AlertCircle size={16} color={C.gold} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.5 }}>
            Sorteio balanceado por <b style={{ color: C.chalk }}>posição</b> e <b style={{ color: C.chalk }}>nota individual</b>. Diferença entre os times: <b style={{ color: C.grass }}>1 ponto</b>.
          </div>
        </div>
        <TeamColumn team={timeA} />
        <div style={{ height: 14 }} />
        <TeamColumn team={timeB} />
        <div style={{ height: 18 }} />
        <Btn variant="ghost" icon={Shuffle}>REFAZER SORTEIO</Btn>
      </Body>
    </>
  );
}
function TeamColumn({ team }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: `1px solid ${C.line}`, background: `${team.cor}12` }}>
        <span className="bebas" style={{ fontSize: 22, color: team.cor }}>{team.nome}</span>
        <span style={{ fontSize: 12, color: C.muted }}>Soma de notas <b className="bebas" style={{ color: C.chalk, fontSize: 17 }}>{team.soma}</b></span>
      </div>
      <div style={{ padding: "8px 8px" }}>
        {team.players.map(([nome, pos, nota], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 8px" }}>
            <span style={{ width: 34, fontSize: 10, fontWeight: 700, color: C.muted, background: C.card2, padding: "4px 0", borderRadius: 6, textAlign: "center" }}>{pos}</span>
            <span style={{ color: C.chalk, fontSize: 14, fontWeight: 500, flex: 1 }}>{nome}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Star size={12} color={team.cor} fill={team.cor} />
              <b className="bebas" style={{ color: C.chalk, fontSize: 16 }}>{nota}</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 9. NOTAS DOS JOGADORES
function Notas({ go }) {
  const [notas, setNotas] = useState({ 0: 8, 1: 7, 2: 9, 3: 6 });
  const players = [["Marcão", "GOL", "MG"], ["Tota", "ZAG", "TÔ"], ["Caco", "MEI", "CA"], ["Léo", "ATA", "LÉ"]];
  return (
    <>
      <TopBar title="NOTAS DO ELENCO" onBack={() => go("home")} />
      <Body>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 15px", marginBottom: 18, display: "flex", gap: 10 }}>
          <Shield size={16} color="#8FB4FF" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.5 }}>
            Visível só para <b style={{ color: C.chalk }}>presidente, tesoureiro e conselheiros</b>. A média das notas alimenta o sorteio balanceado.
          </div>
        </div>
        {players.map(([nome, pos, ini], i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 15px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
              <Avatar label={ini} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ color: C.chalk, fontSize: 14.5, fontWeight: 600 }}>{nome}</div>
                <div style={{ color: C.muted, fontSize: 11.5 }}>{pos} · média 7.8</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="bebas" style={{ fontSize: 26, color: C.gold, lineHeight: .9 }}>{notas[i]}</div>
                <div style={{ fontSize: 9, color: C.muted }}>sua nota</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[...Array(10)].map((_, n) => (
                <button key={n} className="tap" onClick={() => setNotas((v) => ({ ...v, [i]: n + 1 }))}
                  style={{ flex: 1, height: 26, borderRadius: 6, cursor: "pointer", border: "none",
                    background: n < notas[i] ? C.gold : C.card2, color: n < notas[i] ? C.ink : C.muted,
                    fontSize: 11, fontWeight: 700 }}>{n + 1}</button>
              ))}
            </div>
          </div>
        ))}
      </Body>
    </>
  );
}

// 10. VOTAÇÃO DO JOGO
function Votacao({ go }) {
  const [q1, setQ1] = useState("Caco");
  const opts = ["Marcão", "Caco", "Léo", "Júnior"];
  return (
    <>
      <TopBar title="VOTAÇÃO DO JOGO" onBack={() => go("home")} />
      <Body>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ color: C.muted, fontSize: 13 }}>Racha de sábado · 26 jul</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: C.grass }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, background: C.grass }} /> ABERTA
          </span>
        </div>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 18, fontStyle: "italic" }}>
          Formulário criado pelos conselheiros · encerra em 2h
        </div>

        <VoteQuestion n={1} label="Craque do jogo" opts={opts} value={q1} onPick={setQ1} avatars />
        <VoteQuestion n={2} label="Pé-frio da rodada 😅" opts={["Bill", "Nando", "Kadu", "Rafa"]} value="Bill" onPick={() => {}} avatars />
        <VoteQuestion n={3} label="Nota do racha (organização)" opts={["Ótimo", "Bom", "Regular", "Ruim"]} value="Bom" onPick={() => {}} />

        <div style={{ marginTop: 4 }}><Btn icon={Check}>ENVIAR MEUS VOTOS</Btn></div>
      </Body>
    </>
  );
}
function VoteQuestion({ n, label, opts, value, onPick, avatars }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", gap: 9, alignItems: "baseline", marginBottom: 11 }}>
        <span className="bebas" style={{ fontSize: 18, color: C.gold }}>{String(n).padStart(2, "0")}</span>
        <span style={{ color: C.chalk, fontSize: 15, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {opts.map((o) => {
          const on = o === value;
          return (
            <button key={o} className="tap" onClick={() => onPick(o)} style={{
              display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 12, cursor: "pointer",
              background: on ? `${C.gold}14` : C.card, border: `1px solid ${on ? C.gold : C.line}`, textAlign: "left",
            }}>
              {avatars && <Avatar label={o.slice(0, 2).toUpperCase()} size={30} gold={on} />}
              <span style={{ flex: 1, color: C.chalk, fontSize: 14, fontWeight: on ? 700 : 500 }}>{o}</span>
              <span style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${on ? C.gold : C.line}`, display: "grid", placeItems: "center" }}>
                {on && <span style={{ width: 10, height: 10, borderRadius: 5, background: C.gold }} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 11. FINANCEIRO / MENSALIDADES
function Financeiro({ go }) {
  const rows = [
    ["Marcão", "MG", "PAGO"], ["Tota", "TÔ", "PAGO"], ["Caco", "CA", "PAGO"],
    ["Léo", "LÉ", "PENDENTE"], ["Bill", "BI", "ATRASADO"], ["Rafa", "RA", "ATRASADO"],
  ];
  const cor = { PAGO: C.grass, PENDENTE: C.gold, ATRASADO: C.alert };
  return (
    <>
      <TopBar title="MENSALIDADES" onBack={() => go("home")} />
      <Body>
        {/* resumo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
          <SummaryCard label="ARRECADADO · JUL" value="R$ 780" sub="de R$ 1.020" />
          <SummaryCard label="PENDENTE · JUL" value="R$ 240" sub="4 atletas" alert />
        </div>
        <div style={{ background: "linear-gradient(180deg,#1D2A22,#141D18)", border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 18px", marginBottom: 8 }}>
          <div style={{ fontSize: 10.5, letterSpacing: 1.5, color: C.muted, fontWeight: 700, marginBottom: 6 }}>ACUMULADO EM 2026</div>
          <div className="bebas" style={{ fontSize: 40, color: C.gold, lineHeight: .9 }}>R$ 6.480</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Caixa atual do time: <b style={{ color: C.grass }}>R$ 620</b></div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, color: C.alert, fontSize: 12.5, margin: "16px 2px 12px", fontWeight: 600 }}>
          <Bell size={13} /> Vencimento dia 10 · atrasados já notificados
        </div>

        {rows.map(([nome, ini, status], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 13px", marginBottom: 9 }}>
            <Avatar label={ini} size={34} />
            <div style={{ flex: 1 }}>
              <div style={{ color: C.chalk, fontSize: 14.5, fontWeight: 600 }}>{nome}</div>
              <div style={{ color: C.muted, fontSize: 11.5 }}>R$ 60 · julho</div>
            </div>
            {status === "PAGO"
              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: cor[status] }}><Check size={13} /> {status}</span>
              : <button className="tap" style={{ fontSize: 11, fontWeight: 700, color: cor[status], background: `${cor[status]}14`, border: `1px solid ${cor[status]}44`, borderRadius: 8, padding: "7px 11px", cursor: "pointer" }}>Confirmar</button>}
          </div>
        ))}
      </Body>
    </>
  );
}
function SummaryCard({ label, value, sub, alert }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${alert ? C.alert + "55" : C.line}`, borderRadius: 16, padding: "14px 15px" }}>
      <div style={{ fontSize: 9.5, letterSpacing: 1.2, color: alert ? C.alert : C.muted, fontWeight: 700, marginBottom: 7 }}>{label}</div>
      <div className="bebas" style={{ fontSize: 26, color: C.chalk, lineHeight: .9 }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 11.5, marginTop: 5 }}>{sub}</div>
    </div>
  );
}
