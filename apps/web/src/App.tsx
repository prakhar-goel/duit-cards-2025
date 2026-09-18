import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Plus,
  Search,
  Download,
  Share2,
  QrCode,
  Mail,
  Phone,
  Globe2,
  MapPin,
  LayoutDashboard,
  Users,
  Layers3,
  Activity,
  Sparkles,
  Shield,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Copy,
  Clock3,
  LockKeyhole,
  SlidersHorizontal,
  Archive,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  CalendarDays,
  FileText,
  RefreshCw,
  Inbox,
  CircleHelp,
} from "lucide-react";
import QRCode from "qrcode";
import {
  api,
  post,
  patch,
  session,
  saveSession,
  Row,
  date,
  count,
  safeUrl,
} from "./api";

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <a
      href="/"
      className={`logo ${inverse ? "inverse" : ""}`}
      aria-label="DUIT home"
    >
      <span className="logo-mark">
        <i />
        <i />
        <i />
        <i />
      </span>
      duit<span className="logo-dot">.</span>
    </a>
  );
}
function Avatar({
  name = "",
  src,
  size = 44,
}: {
  name?: string;
  src?: string;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.31 }}
    >
      {src && !broken ? (
        <ProtectedImage
          src={src}
          alt={name}
          fallback={name
            .split(" ")
            .slice(0, 2)
            .map((x) => x[0])
            .join("")}
        />
      ) : (
        name
          .split(" ")
          .slice(0, 2)
          .map((x) => x[0])
          .join("")
      )}
    </span>
  );
}
function Tag({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
function Empty({
  title,
  body,
  icon = Users,
}: {
  title: string;
  body: string;
  icon?: React.ElementType;
}) {
  const Icon = icon;
  return (
    <div className="empty">
      <span>
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
function Loading() {
  return (
    <div className="loading">
      <Loader2 className="spin" size={22} />
      <span>Getting things ready…</span>
    </div>
  );
}
function Notice({ message }: { message: string }) {
  return message ? (
    <div className="notice" role="alert">
      <AlertCircle size={17} />
      {message}
    </div>
  ) : null;
}
function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", key);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = old;
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

function Landing() {
  return (
    <div className="landing">
      <nav>
        <Logo />
        <div>
          <a href="#how">How it works</a>
          <a href="/admin" className="button soft">
            Pilot workspace <ArrowUpRight size={16} />
          </a>
        </div>
      </nav>
      <main>
        <Tag tone="lime">
          <span className="status-dot" /> DUIT 2026 · PRIVATE PILOT
        </Tag>
        <h1>
          Good meetings
          <br />
          deserve a <em>next chapter.</em>
        </h1>
        <p className="landing-intro">
          Share what you do. Remember who you met.
          <br />
          Turn a promising hello into something that matters.
        </p>
        <div className="button-row">
          <a href="/c/maya-desai-demo" className="button primary">
            Meet your next introduction <ArrowUpRight size={18} />
          </a>
          <a href="/download" className="button outline">
            Get the Android app <Download size={17} />
          </a>
        </div>
        <div className="landing-scene">
          <div className="scene-caption">
            <span>01 — THE HELLO</span>
            <h2>
              A little context.
              <br />A lot more possibility.
            </h2>
            <p>Your business, your story, and a clear way to start.</p>
          </div>
          <div className="visual-orbit">
            <div className="orbit o1" />
            <div className="orbit o2" />
            <div className="orbit o3" />
            <div className="orbit-core">
              <span className="logo-mark">
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className="float-note n1">
              <CheckCircle2 size={20} />
              <div>
                <strong>Remember the conversation</strong>
                <span>Not just a name in your contacts.</span>
              </div>
            </div>
            <div className="float-note n2">
              <Sparkles size={20} />
              <div>
                <strong>Find a reason to reconnect</strong>
                <span>With the context to make it useful.</span>
              </div>
            </div>
            <div className="float-note n3">
              <ArrowUpRight size={20} />
              <div>
                <strong>Make the next move</strong>
                <span>One thoughtful follow-up.</span>
              </div>
            </div>
          </div>
        </div>
        <section id="how" className="steps">
          {[
            [
              "01",
              "Show the business behind the name.",
              "A clear, shareable profile that opens instantly. No app required to get the point.",
            ],
            [
              "02",
              "Keep the story of the meeting.",
              "Who, where, what you discussed, and what you promised. Your memory gets a little backup.",
            ],
            [
              "03",
              "Make a useful next move.",
              "Find people who can help, people you can help, and the right moment to say hello again.",
            ],
          ].map(([n, t, b]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{b}</p>
            </article>
          ))}
        </section>
      </main>
      <footer>
        <Logo />
        <span>Built for the business that happens between people.</span>
        <Tag>Good conversations deserve a next step</Tag>
      </footer>
    </div>
  );
}

function DownloadPage() {
  const [exists, setExists] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/downloads/DUIT-2026-Pilot.apk", { method: "HEAD" })
      .then((r) =>
        setExists(
          r.ok && r.headers.get("content-type")?.includes("android") === true,
        ),
      )
      .catch(() => setExists(false));
  }, []);
  return (
    <div className="simple-page">
      <Logo />
      <section className="download-panel">
        <span className="large-symbol">
          <Download size={32} />
        </span>
        <Tag tone="lime">ANDROID · PRIVATE PILOT</Tag>
        <h1>
          Your next meeting,
          <br />
          <em>remembered.</em>
        </h1>
        <p>
          Install DUIT 2026 on your Android phone. It lives alongside the
          restored DUIT app.
        </p>
        {exists ? (
          <a className="button primary" href="/downloads/DUIT-2026-Pilot.apk">
            Download the APK <Download size={18} />
          </a>
        ) : (
          <Notice
            message={
              exists === null
                ? "Checking the current build…"
                : "The APK has not been attached to this server yet. Use the build supplied with your pilot invitation."
            }
          />
        )}
        <div className="callout">
          <LockKeyhole size={19} />
          <div>
            <strong>For invited testers</strong>
            <p>
              You’ll need your pilot account and server address. Your private
              meeting notes stay with your account.
            </p>
          </div>
        </div>
        <a href="/" className="text-link">
          <ArrowLeft size={16} /> Back to DUIT
        </a>
      </section>
    </div>
  );
}

function StoryImage({
  src,
  alt,
  kind,
}: {
  src?: string;
  alt: string;
  kind: string;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  let url = safeUrl(src);
  try {
    const parsed = new URL(src || "", location.origin);
    if (
      src &&
      (parsed.pathname.startsWith("/demo/") ||
        parsed.pathname.startsWith("/api/v1/public/media/"))
    )
      url = parsed.pathname;
  } catch {}
  return url && !broken ? (
    <img
      src={url}
      alt={alt}
      draggable={false}
      onError={() => setBroken(true)}
    />
  ) : (
    <div className="story-image-empty">
      {kind === "card" ? <FileText size={38} /> : <Layers3 size={38} />}
      <span>
        {kind === "person"
          ? "Portrait not added yet"
          : kind === "card"
            ? "Business card not added yet"
            : "Business image not added yet"}
      </span>
    </div>
  );
}

function PublicCard({
  slug,
  shareToken,
}: {
  slug?: string;
  shareToken?: string;
}) {
  const [card, setCard] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [dialog, setDialog] = useState(""),
    [toast, setToast] = useState(""),
    [claimAvailable, setClaimAvailable] = useState(false),
    [active, setActive] = useState(0);
  const gesture = React.useRef<{ x: number; y: number } | null>(null);
  const suppressCardClick = React.useRef(false);

  useEffect(() => {
    let cancelled = false;
    setActive(0);
    api(
      shareToken
        ? `/public/shares/${encodeURIComponent(shareToken)}`
        : `/public/cards/${encodeURIComponent(slug || "")}`,
    )
      .then((d) => {
        if (cancelled) return;
        setCard(d.card);
        setClaimAvailable(!!d.claimAvailable);
        const visit =
          sessionStorage.getItem("duit.visit") || crypto.randomUUID();
        sessionStorage.setItem("duit.visit", visit);
        post(`/public/cards/${d.card.slug}/events`, {
          type: "viewed",
          source: shareToken ? "shared_link" : "direct",
          eventKey: `view:${d.card.slug}:${visit}`,
        }).catch(() => {});
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [slug, shareToken]);
  useEffect(() => {
    if (!card) return;
    const openContact = () => {
      if (location.hash === "#contact") setDialog("interest");
    };
    openContact();
    window.addEventListener("hashchange", openContact);
    return () => window.removeEventListener("hashchange", openContact);
  }, [card]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  if (error)
    return (
      <div className="simple-page">
        <Logo />
        <Empty
          icon={LockKeyhole}
          title="This profile isn’t available"
          body="It may be unpublished, or the sharing link may have expired."
        />
        <a className="button outline" href="/">
          Back to DUIT
        </a>
      </div>
    );
  if (!card) return <Loading />;
  const c = card;
  const gallery = c.businessMedia?.length
    ? c.businessMedia
    : [
        {
          url: c.coverUrl,
          type: "image",
          title: c.company,
          caption: c.subtitle,
        },
      ];
  const slides = [
    {
      kind: "person",
      url: c.imageUrl,
      title: c.title,
      caption: [c.role, c.company].filter(Boolean).join(" · "),
      ctaLabel: "Let’s connect", ctaPrompt: c.company, ctaColor: c.theme?.color,
    },
    {
      kind: "card",
      url: c.businessCardUrl,
      title: "Business card",
      caption: c.company,
      ctaLabel: "Work with us", ctaPrompt: c.subtitle, ctaColor: c.theme?.color,
    },
    ...(c.businessCardBackUrl
      ? [
          {
            kind: "card",
            url: c.businessCardBackUrl,
            title: "Card back",
            caption: c.company,
          },
        ]
      : []),
    ...gallery
      .slice(0, 4)
      .map((m: Row) => ({
        kind: m.type,
        url: m.url,
        title: m.title || c.company,
        caption: m.caption || c.subtitle,
        ctaLabel: m.ctaLabel, ctaPrompt: m.ctaPrompt || m.caption, ctaColor: m.ctaColor,
      })),
  ];
  const pages = slides.map((s: Row, i: number) =>
    i === 0
      ? "Person"
      : i === 1
        ? "Card"
        : s.kind === "card"
          ? "Back"
          : s.kind === "video"
            ? "Video"
            : "Business",
  );
  const panels = [...(c.panels || [])].sort(
    (a: Row, b: Row) => a.position - b.position,
  );
  const activeSlide = slides[active];
  const activeLabel = activeSlide?.ctaLabel || c.ctaLabel || "Start a conversation";
  const publicPath = `/public/cards/${c.slug}`;
  const firstName = c.title.split(" ")[0];
  const hook =
    c.subtitle ||
    panels.find((p: Row) => p.panelType === "hook")?.body ||
    c.company ||
    "Let’s make something happen.";
  const track = (type: string) =>
    post(`${publicPath}/events`, {
      type,
      source: "web",
      eventKey: crypto.randomUUID(),
    }).catch(() => {});
  const move = (next: number, focus = false) => {
    const index = Math.max(0, Math.min(slides.length - 1, next));
    setActive(index);
    if (focus) document.getElementById(`story-tab-${index}`)?.focus();
  };
  const keys = (e: React.KeyboardEvent, focus = false) => {
    const next =
      e.key === "ArrowRight"
        ? active + 1
        : e.key === "ArrowLeft"
          ? active - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? slides.length - 1
              : null;
    if (next !== null) {
      e.preventDefault();
      move(next, focus);
    }
  };
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${location.origin}${location.pathname}`,
      );
      setToast("Link copied. A good introduction travels.");
    } catch {
      setDialog("share");
    }
  }
  function action() {
    track("cta_opened");
    setDialog("interest");
  }
  return (
    <div className="public-story">
      <nav className="story-nav" aria-label="DUIT">
        <Logo />
        <span className="story-nav-caption">A proper introduction.</span>
        <div className="story-nav-actions">
          <a href="/download" className="story-get-app">
            Get DUIT <ArrowUpRight size={13} />
          </a>
          <button
            className="story-share-button"
            aria-label="Share profile"
            onClick={() => setDialog("share")}
          >
            <Share2 size={17} />
            <span>Share profile</span>
          </button>
        </div>
      </nav>
      {claimAvailable && (
        <div className="story-invitation">
          <span>An introduction, just for you.</span>
          <button onClick={() => setDialog("claim")}>
            Your profile is waiting <ArrowRight size={16} />
          </button>
        </div>
      )}
      <main className="story-layout">
        <aside className="story-context">
          <div className="story-context-top">
            <span className="story-kicker">MEET YOUR NEXT INTRODUCTION</span>
            <h1>{c.title}</h1>
            <p className="story-role">
              {[c.role, c.company].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="story-context-bottom">
            <span className="story-tiny-line" />
            <button
              className="story-details-link"
              onClick={() => setDialog("details")}
            >
              A little more about {firstName} <ArrowUpRight size={16} />
            </button>
          </div>
        </aside>
        <section
          className="story-gallery"
          aria-label={`${c.title}’s visual introduction`}
        >
          <div
            className="story-tabs"
            role="tablist"
            aria-label="Profile pages"
            onKeyDown={(e) => keys(e, true)}
          >
            {pages.map((label, index) => (
              <button
                key={index}
                id={`story-tab-${index}`}
                role="tab"
                aria-label={label}
                aria-selected={active === index}
                aria-controls={`story-page-${index}`}
                tabIndex={active === index ? 0 : -1}
                onClick={() => move(index)}
              >
                <span className="story-tab-number">0{index + 1}</span>
                {label}
                <span className="story-tab-line" />
              </button>
            ))}
          </div>
          <div
            className={`story-stage story-stage-${active}`}
            onKeyDown={(e) => keys(e)}
            onPointerDown={(e) => {
              suppressCardClick.current = false;
              if (e.isPrimary) gesture.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const start = gesture.current;
              gesture.current = null;
              if (!start) return;
              const dx = e.clientX - start.x,
                dy = e.clientY - start.y;
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                suppressCardClick.current = true;
                move(active + (dx < 0 ? 1 : -1));
              }
            }}
            onPointerCancel={() => {
              gesture.current = null;
            }}
          >
            {slides.map((slide: Row, index: number) => (
              <div
                key={index}
                id={`story-page-${index}`}
                className={`story-page story-page-${slide.kind === "person" ? "person" : slide.kind === "card" ? "card" : "business"}`}
                role="tabpanel"
                aria-labelledby={`story-tab-${index}`}
                hidden={index !== active}
                tabIndex={0}
              >
                {slide.kind === "video" ? (
                  index === active && (
                    <video
                      src={slide.url?.replace(
                        /^https?:\/\/[^/]+(?=\/demo\/)/,
                        "",
                      )}
                      controls
                      playsInline
                      preload="metadata"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  )
                ) : slide.kind === "card" ? (
                  <button
                    className="story-card-art"
                    aria-label="View original business card"
                    disabled={!slide.url}
                    onClick={(e) => {
                      if (!suppressCardClick.current || e.detail === 0)
                        setDialog("card");
                    }}
                  >
                    <StoryImage
                      src={slide.url}
                      alt={`${c.title} — ${slide.title}`}
                      kind="card"
                    />
                  </button>
                ) : (
                  <StoryImage
                    src={slide.url}
                    alt={slide.title}
                    kind={slide.kind === "person" ? "person" : "business"}
                  />
                )}
                {slide.kind === "person" && (
                  <div className="story-person-caption">
                    <h2>{slide.title}</h2>
                    <p>{slide.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: "18px 4px 0" }}>
            <h2 style={{ fontSize: 22, margin: "0 0 7px" }}>
              {slides[active]?.title}
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
              {slides[active]?.caption}
            </p>
          </div>
          <div className="story-gallery-footer">
            <span className="story-position" aria-live="polite">
              <strong>0{active + 1}</strong>
              <span>/ {String(slides.length).padStart(2, "0")}</span>
              <span className="story-position-name">{pages[active]}</span>
            </span>
            <span className="story-swipe-hint">Swipe to explore</span>
            <div className="story-arrows">
              <button
                aria-label="Previous page"
                disabled={active === 0}
                onClick={() => move(active - 1)}
              >
                <ArrowLeft size={19} />
              </button>
              <button
                aria-label="Next page"
                disabled={active === slides.length - 1}
                onClick={() => move(active + 1)}
              >
                <ArrowRight size={19} />
              </button>
            </div>
          </div>
        </section>
      </main>
      <div className="story-dock" style={{borderTopColor: activeSlide?.ctaColor || c.theme?.color}}>
        <div className="story-dock-identity">
          <Avatar name={c.title} src={c.imageUrl} size={42} />
          <div>
            <strong>{c.title}</strong>
            <span>{activeSlide?.ctaPrompt || c.company || c.role}</span>
          </div>
        </div>
        <div className="story-dock-actions">
          <button className="story-primary-action" onClick={action}>
            {activeLabel}
            <ArrowUpRight size={19} />
          </button>
          <a
            className="story-secondary-action"
            aria-label="Save contact"
            href={`/api/v1${publicPath}/vcard`}
            onClick={() => track("contact_saved")}
          >
            <Download size={19} />
            <span>Save contact</span>
          </a>
          <button
            className="story-secondary-action"
            aria-label="Show QR code"
            onClick={() => setDialog("share")}
          >
            <QrCode size={19} />
            <span>QR code</span>
          </button>
        </div>
      </div>
      <footer className="story-footer">
        <span>Make the next meeting count.</span>
        <a href="/download">
          Make your own DUIT card <ArrowUpRight size={14} />
        </a>
      </footer>
      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
      {dialog === "card" && (
        <Modal
          title={`${c.title}’s business card`}
          onClose={() => setDialog("")}
          wide
        >
          <div className="story-card-lightbox">
            <StoryImage
              src={
                slides[active]?.kind === "card"
                  ? slides[active].url
                  : c.businessCardUrl
              }
              alt={`${c.title}’s full business card`}
              kind="card"
            />
            <a
              href={safeUrl(c.businessCardUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Open original image <ExternalLink size={15} />
            </a>
          </div>
        </Modal>
      )}
      {dialog === "share" && (
        <ShareModal title={c.title} onClose={() => setDialog("")} copy={copy} />
      )}
      {dialog === "interest" && (
        <InterestModal
          slug={c.slug}
          label={activeLabel}
          context={activeSlide?.title || c.company}
          name={c.title}
          onClose={() => setDialog("")}
        />
      )}
      {dialog === "claim" && shareToken && (
        <ClaimModal token={shareToken} onClose={() => setDialog("")} />
      )}
      {dialog === "details" && (
        <Modal
          title={`A little more about ${firstName}`}
          onClose={() => setDialog("")}
        >
          <div className="story-details">
            <p>{c.bio || c.subtitle}</p>
            {panels
              .filter((p: Row) =>
                ["offer", "outcome", "proof"].includes(p.panelType),
              )
              .map((p: Row) => (
                <section key={p.panelType}>
                  <span>
                    {p.panelType === "offer"
                      ? "What I do"
                      : p.panelType === "outcome"
                        ? "What we can do together"
                        : "Experience & evidence"}
                  </span>
                  <p>{p.body}</p>
                </section>
              ))}
            <div className="contact-list">
              {c.contact?.email && (
                <a href={`mailto:${c.contact.email}`}>
                  <Mail size={17} />
                  <span>{c.contact.email}</span>
                  <ArrowUpRight size={15} />
                </a>
              )}
              {c.contact?.phone && (
                <a href={`tel:${c.contact.phone.replace(/[^+\d]/g, "")}`}>
                  <Phone size={17} />
                  <span>{c.contact.phone}</span>
                  <ArrowUpRight size={15} />
                </a>
              )}
              {c.contact?.website && (
                <a
                  href={safeUrl(c.contact.website)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe2 size={17} />
                  <span>{c.contact.website.replace(/^https?:\/\//, "")}</span>
                  <ArrowUpRight size={15} />
                </a>
              )}
              {(c.links || []).map((l: Row) => (
                <a
                  key={l.url}
                  href={safeUrl(l.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe2 size={17} />
                  <span>{l.label}</span>
                  <ArrowUpRight size={15} />
                </a>
              ))}
            </div>
            <button className="button primary full" onClick={action}>
              {c.ctaLabel || "Start a conversation"}
              <ArrowUpRight size={17} />
            </button>
            <a className="story-details-download" href="/download">
              Save the person and the conversation in DUIT{" "}
              <ArrowUpRight size={15} />
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ShareModal({
  title,
  onClose,
  copy,
}: {
  title: string;
  onClose: () => void;
  copy: () => void;
}) {
  const [qr, setQr] = useState("");
  const shareUrl = `${location.origin}${location.pathname}`;
  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 340,
      margin: 2,
      color: { dark: "#163d35", light: "#ffffff" },
    }).then(setQr);
  }, []);
  return (
    <Modal title="A good introduction travels." onClose={onClose}>
      <div className="share-modal">
        <p>Share {title}’s business profile.</p>
        {qr && (
          <img
            src={qr}
            alt="QR code to open this profile"
            className="qr-image"
          />
        )}
        <div className="copy-field">
          <input aria-label="Share link" readOnly value={shareUrl} />
          <button className="icon-button" aria-label="Copy link" onClick={copy}>
            <Copy size={18} />
          </button>
        </div>
        <a
          className="button primary full"
          href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          Share on WhatsApp <ArrowUpRight size={17} />
        </a>
      </div>
    </Modal>
  );
}
function InterestModal({
  label = "Start a conversation",
  context = "",
  slug,
  name,
  onClose,
}: {
  slug: string;
  label?: string;
  context?: string;
  name: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await post(`/public/cards/${slug}/leads`, {
        name: f.get("name"),
        email: f.get("email"),
        intent: f.get("intent"),
        consent: true,
        source: "web_profile",
        ctaContext: `${label} · ${context}`.slice(0,120),
      });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={done ? "You’ve started something." : label}
      onClose={onClose}
    >
      {done ? (
        <div className="success-state">
          <CheckCircle2 size={44} />
          <h3>Your note is in {name.split(" ")[0]}’s inbox.</h3>
          <p>They can reply using the email you provided.</p>
          <button className="button primary" onClick={onClose}>
            Back to the profile
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="form-stack">
          <p>A short introduction is a great place to start.</p>
          <label>
            Your name
            <input
              name="name"
              defaultValue={session()?.user?.profile?.fullName || session()?.user?.displayName || ""}
              autoComplete="name"
              required
              maxLength={120}
              placeholder="Alex Morgan"
            />
          </label>
          <label>
            Email
            <input
              name="email"
              defaultValue={session()?.user?.email || ""}
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
            />
          </label>
          <label>
            What would you like to talk about?
            <textarea
              name="intent"
              maxLength={500}
              required
              placeholder="I’m working on…"
              rows={4}
            />
          </label>
          <label className="checkbox">
            <input type="checkbox" required />I agree to share these details
            with {name} so they can respond.
          </label>
          <Notice message={error} />
          <button className="button primary full" disabled={busy}>
            {busy ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <>
                Send introduction <ArrowUpRight size={17} />
              </>
            )}
          </button>
        </form>
      )}
    </Modal>
  );
}
function ClaimModal({
  token,
  onClose,
}: {
  token: string;
  onClose: () => void;
}) {
  const [existing, setExisting] = useState(false),
    [step, setStep] = useState(0),
    [email, setEmail] = useState(""),
    [verification, setVerification] = useState(""),
    [proof, setProof] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function advance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      if (step === 0) {
        const d = await post(`/public/shares/${token}/claim/start`, { email });
        setMessage(
          d.message +
            (d.delivery === "local_outbox"
              ? " This private pilot uses an operator-only local outbox. No email has been sent."
              : ""),
        );
        setStep(1);
      } else if (step === 1) {
        setProof(
          await post(`/public/shares/${token}/claim/verify`, {
            verificationToken: verification,
          }),
        );
        setStep(2);
      } else {
        if (!session()) {
          const auth = await post(existing ? "/auth/login" : "/auth/signup", {
            email,
            password: f.get("password"),
            displayName: f.get("fullName"),
            claimToken: proof?.claimToken,
          });
          saveSession(auth);
        }
        await post("/claims/accept", {
          claimToken: proof?.claimToken,
          profile: {
            fullName: f.get("fullName"),
            company: f.get("company"),
            role: f.get("role"),
            phone: f.get("phone"),
          },
        });
        setStep(3);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Make this introduction yours." onClose={onClose}>
      {step === 3 ? (
        <div className="success-state">
          <CheckCircle2 size={42} />
          <h3>Your private profile draft is saved.</h3>
          <p>
            Open DUIT to add your offer, review your business profile, and
            publish when you’re ready.
          </p>
          <a className="button primary" href="/download">
            Get the app <ArrowUpRight size={16} />
          </a>
        </div>
      ) : (
        <form className="form-stack" onSubmit={advance}>
          {step === 0 ? (
            <>
              <p>
                Someone started a profile for you. Verify the email they used
                before reviewing those details.
              </p>
              <label>
                Your email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </>
          ) : step === 1 ? (
            <>
              <p>{message}</p>
              <label>
                Verification token
                <input
                  required
                  value={verification}
                  onChange={(e) => setVerification(e.target.value)}
                  autoComplete="one-time-code"
                />
              </label>
            </>
          ) : (
            <>
              <p>
                These are suggested details, not a published profile. Make them
                your own.
              </p>
              {[
                ["fullName", "Your name", proof?.draft?.name],
                ["company", "Company", proof?.draft?.company],
                ["role", "Role", proof?.draft?.role],
                ["phone", "Phone", proof?.draft?.phone],
              ].map(([key, label, value]) => (
                <label key={key}>
                  {label}
                  <input
                    name={key}
                    defaultValue={value || ""}
                    required={key === "fullName"}
                  />
                </label>
              ))}
              {!session() && (
                <>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={existing}
                      onChange={(e) => setExisting(e.target.checked)}
                    />
                    I already have a DUIT account with this email.
                  </label>
                  <label>
                    {existing ? "Your password" : "Create a password"}
                    <input
                      name="password"
                      type="password"
                      minLength={existing ? 1 : 10}
                      required
                      autoComplete={
                        existing ? "current-password" : "new-password"
                      }
                    />
                  </label>
                </>
              )}
              <label className="checkbox">
                <input type="checkbox" required />
                I’ve reviewed these details and want to save my private draft.
              </label>
            </>
          )}
          <Notice message={error} />
          <button className="button primary full" disabled={busy}>
            {busy ? (
              <Loader2 size={18} className="spin" />
            ) : step === 0 ? (
              "Verify my email"
            ) : step === 1 ? (
              "Review my details"
            ) : (
              "Accept my profile"
            )}
            <ArrowRight size={17} />
          </button>
        </form>
      )}
    </Modal>
  );
}

export default function App() {
  const path = location.pathname;
  const slug = path.match(/^\/c\/([^/]+)\/?$/)?.[1],
    share = path.match(/^\/s\/([^/]+)\/?$/)?.[1];
  if (slug || share) return <PublicCard slug={slug} shareToken={share} />;
  if (path.startsWith("/admin")) return <Admin />;
  if (path === "/download") return <DownloadPage />;
  return <Landing />;
}

const adminNav = [
  ["overview", "Overview", LayoutDashboard],
  ["users", "People & accounts", Users],
  ["cards", "Business profiles", Layers3],
  ["archive", "Archive library", Archive],
  ["activity", "Activity log", Activity],
  ["ai", "AI & usage", Sparkles],
  ["outbox", "Verification outbox", Inbox],
] as const;
function Admin() {
  const [auth, setAuth] = useState<Row | null>(session()),
    [page, setPage] = useState(location.pathname.split("/")[2] || "overview"),
    [menu, setMenu] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (auth)
      api("/me")
        .then((d) => {
          if (d.user.role !== "admin")
            setError(
              "This account does not have operator access. Sign in with your pilot administrator account.",
            );
        })
        .catch(() => {
          saveSession(null);
          setAuth(null);
        });
  }, [auth]);
  function navigate(p: string) {
    setPage(p);
    history.pushState({}, "", `/admin/${p}`);
    setMenu(false);
  }
  useEffect(() => {
    const f = () => setPage(location.pathname.split("/")[2] || "overview");
    addEventListener("popstate", f);
    return () => removeEventListener("popstate", f);
  }, []);
  async function logout() {
    await post("/auth/logout", { refreshToken: auth?.refreshToken }).catch(
      () => {},
    );
    saveSession(null);
    setAuth(null);
    setError("");
  }
  if (!auth) return <AdminLogin onLogin={setAuth} />;
  return (
    <div className="admin-app">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Logo />
        <div className="workspace-label">
          <span className="workspace-icon">D</span>
          <div>
            <strong>DUIT workspace</strong>
            <span>Private pilot</span>
          </div>
          <LockKeyhole size={14} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {adminNav.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={page === id ? "selected" : ""}
            >
              <Icon size={19} />
              {label}
              {id === "archive" && <span className="nav-mini">OLD → NEW</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="pilot-note">
            <span className="status-dot" />
            <strong>Built for a useful hello.</strong>
            <p>A private space to shape what comes next.</p>
          </div>
          <a href="/c/maya-desai-demo" className="sidebar-link" target="_blank">
            Open a card <ArrowUpRight size={17} />
          </a>
          <button className="operator" onClick={logout}>
            <Avatar
              name={auth.user?.displayName || "Pilot operator"}
              size={35}
            />
            <span>
              <strong>{auth.user?.displayName || "Pilot operator"}</strong>
              <small>Administrator</small>
            </span>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      {menu && <div className="nav-scrim" onClick={() => setMenu(false)} />}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={20} />
          </button>
          <span>
            Workspace <ChevronRight size={14} />{" "}
            <strong>
              {adminNav.find((x) => x[0] === page)?.[1] || "Overview"}
            </strong>
          </span>
          <div>
            <Tag tone="green">
              <span className="status-dot" /> Private pilot
            </Tag>
            <a
              className="icon-button"
              aria-label="Open product website"
              href="/"
              target="_blank"
            >
              <ArrowUpRight size={19} />
            </a>
          </div>
        </header>
        <div className="admin-content">
          {error ? (
            <>
              <Notice message={error} />
              <button className="button outline" onClick={logout}>
                Sign out
              </button>
            </>
          ) : page === "overview" ? (
            <Overview navigate={navigate} />
          ) : page === "users" ? (
            <UsersPage />
          ) : page === "cards" ? (
            <CardsPage />
          ) : page === "archive" ? (
            <ArchivePage />
          ) : page === "activity" ? (
            <ActivityPage />
          ) : page === "ai" ? (
            <AiPage />
          ) : page === "outbox" ? (
            <OutboxPage />
          ) : (
            <Overview navigate={navigate} />
          )}
        </div>
        <footer className="admin-footer">
          <span>DUIT 2026</span>
          <span>
            Private relationship notes stay private. <LockKeyhole size={12} />
          </span>
        </footer>
      </div>
    </div>
  );
}
function AdminLogin({ onLogin }: { onLogin: (a: Row) => void }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const d = await post("/auth/login", {
        email: f.get("email"),
        password: f.get("password"),
      });
      if (d.user.role !== "admin")
        throw new Error(
          "Use your pilot operator account to open this workspace.",
        );
      saveSession(d);
      onLogin(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-login">
      <aside>
        <Logo inverse />
        <div>
          <Tag tone="lime">THE DUIT WORKSPACE</Tag>
          <h1>
            Behind every
            <br />
            great network,
            <br />
            <em>real people.</em>
          </h1>
          <p>
            A clear view of the people, introductions and small next steps that
            make DUIT work.
          </p>
        </div>
        <span>MAKE THE NEXT MEETING COUNT.</span>
        <div className="login-orbit" />
      </aside>
      <main>
        <a className="text-link" href="/">
          <ArrowLeft size={16} /> Back to DUIT
        </a>
        <form onSubmit={login} className="form-stack">
          <span className="large-symbol">
            <Shield size={28} />
          </span>
          <div>
            <div className="eyebrow">PRIVATE PILOT</div>
            <h2>Welcome to the workspace.</h2>
            <p>Sign in with your administrator account.</p>
          </div>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              required
            />
          </label>
          <Notice message={error} />
          <button className="button primary full" disabled={busy}>
            {busy ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <>
                Open workspace <ArrowRight size={18} />
              </>
            )}
          </button>
          <p className="fineprint">
            <LockKeyhole size={13} /> Access is limited to invited operators.
          </p>
        </form>
        <small>
          DUIT 2026 · Owner-approved profiles. Private meeting memory.
        </small>
      </main>
    </div>
  );
}

function useData(path: string) {
  const [data, setData] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api(path)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path, version]);
  return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
function Stat({
  label,
  value,
  description,
  icon: Icon,
  tone = "",
}: {
  label: string;
  value: unknown;
  description: string;
  icon: React.ElementType;
  tone?: string;
}) {
  return (
    <article className={`stat ${tone}`}>
      <div>
        <span>{label}</span>
        <Icon size={19} />
      </div>
      <strong>{count(value)}</strong>
      <p>{description}</p>
    </article>
  );
}
function Overview({ navigate }: { navigate: (s: string) => void }) {
  const [origin, setOrigin] = useState("");
  const { data, error, loading, reload } = useData(
    `/admin/overview?dataOrigin=${origin}`,
  );
  if (loading && !data) return <Loading />;
  const s = data?.stats || {},
    daily = Object.values(
      (data?.daily || []).reduce((a: Row, d: Row) => {
        const key = d.date || d.day;
        a[key] ||= { date: key, count: 0 };
        a[key].count += Number(d.count || 0);
        return a;
      }, {}),
    ) as Row[],
    countries = data?.countries || [],
    max = Math.max(
      1,
      ...daily.map((d: Row) => Number(d.encounters || d.count || d.views || 0)),
    );
  return (
    <>
      <PageTitle
        eyebrow="THE BIG PICTURE"
        title="Good connections. Real progress."
        description="A little clarity on the people and conversations behind DUIT."
      >
        <div className="overview-controls">
          <select
            aria-label="Data source"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            <option value="fictional_demo">Curated workspace</option>
            <option value="user_created">Live pilot activity</option>
            <option value="">All pilot activity</option>
          </select>
          <button className="button outline small" onClick={reload}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </PageTitle>
      <Notice message={error} />
      <div className="overview-banner">
        <div>
          <Tag tone="lime">
            {origin === "fictional_demo"
              ? "CURATED WORKSPACE"
              : origin === "user_created"
                ? "LIVE PILOT ACTIVITY"
                : "ALL PILOT ACTIVITY"}
          </Tag>
          <h2>
            Make every introduction
            <br />a little more useful.
          </h2>
          <p>Track the activity. Understand the next step.</p>
          <button className="text-link" onClick={() => navigate("users")}>
            Explore your community <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="banner-graphic">
          <span className="mini-node a">
            <Users size={22} />
          </span>
          <span className="mini-node b">
            <CalendarDays size={23} />
          </span>
          <span className="mini-node c">
            <ArrowUpRight size={28} />
          </span>
          <svg viewBox="0 0 300 190" aria-hidden="true">
            <path d="M65 80 Q140 150 240 70 M65 80 Q120 0 165 165 M165 165 Q210 90 240 70" />
          </svg>
          <span className="banner-note">People → Meetings → Possibilities</span>
        </div>
      </div>
      <div className="stats-grid">
        <Stat
          label="Accounts"
          value={s.users}
          description={`${count(s.activeUsers)} active accounts`}
          icon={Users}
        />
        <Stat
          label="Published profiles"
          value={s.publishedCards}
          description={`${count(s.cards)} business profiles in total`}
          icon={Layers3}
        />
        <Stat
          label="Recorded meetings"
          value={s.encounters}
          description="Moments with context, not just contacts"
          icon={CalendarDays}
        />
        <Stat
          label="Introductions received"
          value={s.leads}
          description="People who shared their interest"
          icon={ArrowUpRight}
          tone="highlight"
        />
      </div>
      <section className="panel" style={{margin: "24px 0", padding: 24}}>
        <h3>Cards starting conversations</h3>
        <p className="muted">Recorded card views, CTA opens and enquiries across app and web.</p>
        <div style={{overflowX: "auto"}}><table className="data-table"><thead><tr><th>Business</th><th>Views</th><th>CTA opens</th><th>Enquiries</th></tr></thead><tbody>{(data?.topCards || []).map((c: Row) => <tr key={c.id}><td><strong>{c.company || c.title}</strong><br/><small>{c.title}</small></td><td>{count(c.views)}</td><td>{count(c.ctaOpens)}</td><td>{count(c.leads)}</td></tr>)}</tbody></table></div>
        {!(data?.topCards || []).length && <p>Engagement will appear as people explore cards.</p>}
      </section>
      <section className="panel" style={{margin: "24px 0", padding: 24}}>
        <h3>Recent enquiries</h3>
        {(data?.recentLeads || []).map((l: Row) => <div key={l.id} style={{padding: "16px 0", borderBottom: "1px solid #e1e5df"}}><strong>{l.name} → {l.company || l.cardTitle}</strong><p>{l.intent || l.ctaContext}</p><small>{l.ctaContext} · {l.source} · {date(l.createdAt,true)} · {l.status}</small></div>)}
        {!(data?.recentLeads || []).length && <p>New enquiries arrive here when someone submits a card’s contact form.</p>}
      </section>
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Activity, over time</h3>
              <p>Profile actions recorded in the last 30 days</p>
            </div>
            <Tag>Last 30 days</Tag>
          </div>
          {daily.length ? (
            <div className="bar-chart">
              {daily.map((d: Row, i: number) => (
                <div className="chart-column" key={d.date || i}>
                  <span className="chart-value">
                    {count(d.encounters || d.count || d.views)}
                  </span>
                  <div
                    className="chart-bar"
                    style={{
                      height: `${Math.max(2, (Number(d.encounters || d.count || d.views || 0) / max) * 160)}px`,
                    }}
                  />
                  <span>
                    {new Date(d.date || d.day).toLocaleDateString("en", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="The story starts with a meeting."
              body="Recorded activity will appear here as people use the pilot."
              icon={Activity}
            />
          )}
          <div className="chart-foot">
            <span>
              <i /> Recorded activity
            </span>
            <span>
              {origin === "fictional_demo"
                ? "Workspace activity"
                : "Views and actions are not sales"}
            </span>
          </div>
        </section>
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>A network without borders</h3>
              <p>Account countries, where provided</p>
            </div>
            <Globe2 size={21} />
          </div>
          <div className="countries">
            {countries.length ? (
              countries.slice(0, 6).map((c: Row, i: number) => (
                <div key={i}>
                  <span className="country-icon">
                    {(c.countryCode || c.country_code || "—").slice(0, 2)}
                  </span>
                  <strong>
                    {countryName(c.country || c.countryCode || c.country_code)}
                  </strong>
                  <span>{count(c.count || c.users)}</span>
                  <div className="country-track">
                    <i
                      style={{
                        width: `${Math.max(4, (Number(c.count || c.users || 0) / Math.max(1, ...countries.map((x: Row) => Number(x.count || x.users || 0)))) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <Empty
                title="Room to grow."
                body="Countries appear when people add them to their profile."
                icon={Globe2}
              />
            )}
          </div>
        </section>
      </div>
      <div className="overview-grid lower">
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>From hello to a next step</h3>
              <p>Different actions. Different meanings.</p>
            </div>
            <ArrowUpRight size={20} />
          </div>
          <div className="funnel">
            {[
              ["Profile views", s.views, "A profile was opened"],
              ["CTA opens", s.ctaOpens, "Someone chose a contact action"],
              ["Introductions", s.leads, "Details and interest were submitted"],
              [
                "Open promises",
                s.openCommitments,
                "A next step is still waiting",
              ],
            ].map(([l, v, d], i) => (
              <div key={String(l)}>
                <span className="step-dot">0{i + 1}</span>
                <div>
                  <strong>{l}</strong>
                  <p>{d}</p>
                </div>
                <b>{count(v)}</b>
              </div>
            ))}
          </div>
        </section>
        <section className="panel archive-preview">
          <Archive size={28} />
          <Tag>THE ORIGINAL DUIT</Tag>
          <h3>
            A past full of
            <br />
            <em>possibility.</em>
          </h3>
          <p>
            Explore selected historical business profiles in the private
            archive. Original records stay separate from today’s pilot.
          </p>
          <button
            className="button outline"
            onClick={() => navigate("archive")}
          >
            Open archive library <ArrowUpRight size={16} />
          </button>
        </section>
      </div>
    </>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder = "Search",
  children,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="filters">
      <div className="search-box">
        <Search size={18} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        {value && (
          <button
            className="icon-button"
            onClick={() => onChange("")}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
function Pager({
  total,
  offset,
  setOffset,
  limit = 20,
}: {
  total: number;
  offset: number;
  setOffset: (n: number) => void;
  limit?: number;
}) {
  return (
    <div className="pager">
      <span>
        {total
          ? `${offset + 1}–${Math.min(offset + limit, total)} of ${count(total)}`
          : "No results"}
      </span>
      <div>
        <button
          className="button outline small"
          disabled={!offset}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          <ChevronLeft size={15} /> Previous
        </button>
        <button
          className="button outline small"
          disabled={offset + limit >= total}
          onClick={() => setOffset(offset + limit)}
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
function UsersPage() {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [offset, setOffset] = useState(0),
    [selected, setSelected] = useState<Row | null>(null);
  const { data, error, loading, reload } = useData(
    `/admin/users?search=${encodeURIComponent(search)}&status=${status}&offset=${offset}&limit=20`,
  );
  function change(v: string) {
    setSearch(v);
    setOffset(0);
  }
  return (
    <>
      <PageTitle
        eyebrow="PEOPLE & ACCOUNTS"
        title="A community, one person at a time."
        description="Manage pilot access and see the shape of each account."
      />
      <SearchBar
        value={search}
        onChange={change}
        placeholder="Search name or email…"
      >
        <select
          aria-label="Account status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setOffset(0);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <Tag>{count(data?.total)} accounts</Tag>
      </SearchBar>
      <Notice message={error} />
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Access</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Origin</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(data?.users || []).map((u: Row) => (
                <tr
                  key={u.id}
                  onClick={() => setSelected(u)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(u)}
                >
                  <td>
                    <div className="person-cell">
                      <Avatar
                        name={u.displayName || u.email}
                        src={u.profile?.photoUrl}
                      />
                      <div>
                        <strong>
                          {u.displayName ||
                            u.profile?.fullName ||
                            "Unnamed account"}
                        </strong>
                        <span>{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {u.role === "admin" ? (
                      <Tag tone="purple">Operator</Tag>
                    ) : (
                      "Member"
                    )}
                  </td>
                  <td>
                    <Tag tone={u.status === "active" ? "green" : "amber"}>
                      <span className="status-dot" />
                      {u.status}
                    </Tag>
                  </td>
                  <td>{date(u.createdAt)}</td>
                  <td>
                    <Tag>
                      {u.dataOrigin === "fictional_demo"
                        ? "Curated workspace"
                        : u.dataOrigin === "archive"
                          ? "Archive"
                          : "Pilot account"}
                    </Tag>
                  </td>
                  <td>
                    <ArrowUpRight size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && !data ? (
          <Loading />
        ) : !data?.users?.length ? (
          <Empty
            title="No people found"
            body="Try another name, email, or status."
          />
        ) : null}
        <Pager
          total={Number(data?.total || 0)}
          offset={offset}
          setOffset={setOffset}
        />
      </section>
      {selected && (
        <UserModal
          user={selected}
          onClose={() => setSelected(null)}
          onUpdate={reload}
        />
      )}
    </>
  );
}
function UserModal({
  user,
  onClose,
  onUpdate,
}: {
  user: Row;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { data, error } = useData(`/admin/users/${user.id}`),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const u = data?.user || user;
  async function toggle() {
    if (u.status === "active" && !confirmed) {
      setConfirmed(true);
      return;
    }
    setBusy(true);
    try {
      await patch(`/admin/users/${u.id}`, {
        status: u.status === "active" ? "suspended" : "active",
      });
      onUpdate();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Account overview" onClose={onClose}>
      <div className="user-summary">
        <Avatar
          name={u.displayName || u.email}
          src={u.profile?.photoUrl}
          size={76}
        />
        <h2>{u.displayName || u.email}</h2>
        <p>{u.email}</p>
        <Tag tone="green">{u.status}</Tag>
      </div>
      <Notice message={err || error} />
      <div className="mini-stats">
        {Object.entries(data?.stats || {}).map(([k, v]) => (
          <div key={k}>
            <strong>{count(v)}</strong>
            <span>{k.replace(/([A-Z])/g, " $1")}</span>
          </div>
        ))}
      </div>
      <dl className="definition">
        <dt>Joined</dt>
        <dd>{date(u.createdAt, true)}</dd>
        <dt>Role</dt>
        <dd>{u.role}</dd>
        <dt>Country</dt>
        <dd>{u.profile?.countryCode || "Not provided"}</dd>
        <dt>Company</dt>
        <dd>{u.profile?.company || "Not provided"}</dd>
      </dl>
      <div className="callout">
        <LockKeyhole size={17} />
        <p>
          Meeting notes and private contacts are not exposed in this operator
          view.
        </p>
      </div>
      <button
        className={`button ${u.status === "active" ? "danger" : "primary"} full`}
        onClick={toggle}
        disabled={busy || u.id === session()?.user?.id}
      >
        {u.status === "active"
          ? confirmed
            ? "Confirm suspension — sign this account out"
            : "Suspend account access"
          : "Restore account access"}
      </button>
    </Modal>
  );
}
function CardsPage() {
  const [search, setSearch] = useState(""),
    [offset, setOffset] = useState(0),
    [selected, setSelected] = useState<Row | null>(null);
  const { data, error, reload } = useData(
    `/admin/cards?search=${encodeURIComponent(search)}&offset=${offset}&limit=20`,
  );
  return (
    <>
      <PageTitle
        eyebrow="BUSINESS PROFILES"
        title="The business behind the hello."
        description="Published profiles and drafts across your private pilot."
      />
      <SearchBar
        value={search}
        onChange={(v) => {
          setSearch(v);
          setOffset(0);
        }}
        placeholder="Find a person, business or profile…"
      >
        <Tag>{count(data?.total)} profiles</Tag>
      </SearchBar>
      <Notice message={error} />
      <div className="card-grid">
        {(data?.cards || []).map((c: Row) => (
          <article className="business-tile" key={c.id}>
            <div className="tile-cover">
              <div className="cover-lines" />
              <Tag tone={c.isPublished ? "green" : ""}>
                {c.isPublished ? "Published" : "Private draft"}
              </Tag>
              <span>{c.company || "BUSINESS PROFILE"}</span>
            </div>
            <div className="tile-body">
              <Avatar name={c.title} src={c.imageUrl} size={62} />
              <h3>{c.title}</h3>
              <p>{c.subtitle || c.company || "No description yet"}</p>
              <div className="tile-meta">
                <span>
                  <Clock3 size={13} /> {date(c.createdAt)}
                </span>
                <button
                  className="icon-button"
                  aria-label={`Manage ${c.title}`}
                  onClick={() => setSelected(c)}
                >
                  <MoreHorizontal size={19} />
                </button>
              </div>
              <a
                className={`text-link ${!c.isPublished ? "disabled-link" : ""}`}
                href={c.isPublished ? `/c/${c.slug}` : undefined}
                target="_blank"
              >
                {c.isPublished ? "Open profile" : "Not published"}
                <ArrowUpRight size={16} />
              </a>
            </div>
          </article>
        ))}
      </div>
      {!data?.cards?.length && (
        <Empty
          title="Profiles will live here."
          body="As members create their business profiles, you can review publication status here."
          icon={Layers3}
        />
      )}
      <Pager
        total={Number(data?.total || 0)}
        offset={offset}
        setOffset={setOffset}
      />
      {selected && (
        <UnpublishModal
          card={selected}
          onClose={() => setSelected(null)}
          onUpdate={reload}
        />
      )}
    </>
  );
}
function UnpublishModal({
  card,
  onClose,
  onUpdate,
}: {
  card: Row;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await post(`/admin/cards/${card.id}/unpublish`, {
        reason: new FormData(e.currentTarget).get("reason"),
      });
      onUpdate();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`Manage ${card.title}’s profile`} onClose={onClose}>
      {card.isPublished ? (
        <form className="form-stack" onSubmit={submit}>
          <p>
            Unpublishing removes access to the shared profile. The owner’s draft
            and private records remain intact. This action is recorded in the
            audit log.
          </p>
          <label>
            Reason
            <textarea
              name="reason"
              minLength={5}
              maxLength={500}
              required
              rows={3}
            />
          </label>
          <Notice message={err} />
          <button className="button danger" disabled={busy}>
            Unpublish profile
          </button>
        </form>
      ) : (
        <Empty
          title="This profile is a private draft."
          body="The owner must review and approve it before publishing."
          icon={LockKeyhole}
        />
      )}
    </Modal>
  );
}

function countryName(code?: string) {
  try {
    return code && code.length === 2
      ? new Intl.DisplayNames(["en"], { type: "region" }).of(code)
      : "Not provided";
  } catch {
    return code || "Not provided";
  }
}
const phoneCountries: Row = {
  "91": "India",
  "62": "Indonesia",
  "60": "Malaysia",
  "1": "US / Canada",
  "44": "United Kingdom",
  "49": "Germany",
  "33": "France",
  "65": "Singapore",
  "61": "Australia",
  "971": "UAE",
  "31": "Netherlands",
  "66": "Thailand",
  "63": "Philippines",
  "34": "Spain",
  "46": "Sweden",
};
function ArchivePage() {
  const [search, setSearch] = useState(""),
    [country, setCountry] = useState(""),
    [offset, setOffset] = useState(0),
    [selected, setSelected] = useState<Row | null>(null);
  const { data, error, loading } = useData(
    `/admin/archive?search=${encodeURIComponent(search)}&countryCode=${country}&offset=${offset}&limit=24`,
  );
  return (
    <>
      <PageTitle
        eyebrow="THE ORIGINAL DUIT"
        title="Old introductions. New perspective."
        description="A private, read-only collection from the original DUIT archive."
      />
      <div className="archive-intro">
        <Archive size={22} />
        <div>
          <strong>Real historical profiles. Preserved with context.</strong>
          <p>
            These records are not active pilot accounts. Country groups use
            phone prefixes, not verified residence. Details may be out of date.
          </p>
        </div>
        <Tag>Private archive</Tag>
      </div>
      <SearchBar
        value={search}
        onChange={(v) => {
          setSearch(v);
          setOffset(0);
        }}
        placeholder="Search a person, business or story…"
      >
        <select
          aria-label="Archive country"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setOffset(0);
          }}
        >
          <option value="">All phone regions</option>
          {Object.entries(phoneCountries).map(([code, name]) => (
            <option key={code} value={code}>
              {String(name)} (+{code})
            </option>
          ))}
        </select>
        <Tag>{count(data?.total)} profiles</Tag>
      </SearchBar>
      <Notice message={error} />
      <div className="archive-grid">
        {(data?.profiles || []).map((p: Row) => {
          const a = p.profile || p.data || p;
          return (
            <button
              className="archive-tile"
              key={p.id || p.sourceId}
              onClick={() => setSelected(a)}
            >
              <div className="archive-portrait">
                <ProtectedImage
                  src={a.photoUrl || a.photo}
                  alt={a.name}
                  fallback={<Avatar name={a.name} size={100} />}
                />
                <span>
                  {phoneCountries[a.countryCode || a.code] ||
                    `+${a.countryCode || a.code || "—"}`}
                </span>
              </div>
              <div>
                <h3>{a.name}</h3>
                <p>{a.role || "Historical member"}</p>
                <strong>{a.company || "Original DUIT archive"}</strong>
                <div className="archive-counts">
                  <span>{count(a.received)} cards</span>
                  <span>{count(a.events)} meetings</span>
                </div>
              </div>
              <ArrowUpRight size={18} />
            </button>
          );
        })}
      </div>
      {loading && !data ? (
        <Loading />
      ) : !data?.profiles?.length ? (
        <Empty
          title="No archive profiles here yet."
          body="Try a different filter, or import the curated private archive using the setup command."
          icon={Archive}
        />
      ) : null}
      <Pager
        total={Number(data?.total || 0)}
        offset={offset}
        setOffset={setOffset}
        limit={24}
      />
      {selected && (
        <Modal
          title={selected.name || "Historical profile"}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="archive-detail">
            <div className="archive-detail-head">
              <ProtectedImage
                src={selected.photoUrl || selected.photo}
                alt={selected.name}
                fallback={<Avatar name={selected.name} size={88} />}
              />
              <div>
                <Tag>Private historical record</Tag>
                <h2>{selected.name}</h2>
                <p>
                  {selected.role} {selected.company && `· ${selected.company}`}
                </p>
                <span>
                  Account created {date(selected.created || selected.createdAt)}
                </span>
              </div>
            </div>
            <p className="archive-pitch">
              {selected.pitch ||
                selected.bio ||
                "No written business introduction was supplied."}
            </p>
            <div className="mini-stats">
              <div>
                <strong>{count(selected.received)}</strong>
                <span>Received e-cards</span>
              </div>
              <div>
                <strong>{count(selected.sent)}</strong>
                <span>Cards sent</span>
              </div>
              <div>
                <strong>{count(selected.events)}</strong>
                <span>Meeting events</span>
              </div>
            </div>
            <div className="archive-media">
              {(selected.media || []).map((m: Row, i: number) => (
                <figure key={i}>
                  <ProtectedImage
                    src={m.url || m.file}
                    alt={m.label || "Historical business image"}
                  />
                  <figcaption>{m.label || "Business image"}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
function ProtectedImage({
  src,
  alt,
  fallback,
}: {
  src?: string;
  alt: string;
  fallback?: React.ReactNode;
}) {
  const [url, setUrl] = useState(""),
    [broken, setBroken] = useState(false);
  useEffect(() => {
    if (!src) return;
    let normalized = src;
    try {
      const u = new URL(src, location.origin);
      if (u.pathname.startsWith("/api/v1/") || u.pathname.startsWith("/demo/"))
        normalized = u.pathname;
    } catch {}
    let cancelled = false,
      object = "";
    if (normalized.startsWith("/api/")) {
      fetch(normalized, {
        headers: { Authorization: `Bearer ${session()?.accessToken || ""}` },
      })
        .then((r) => {
          if (!r.ok) throw Error();
          return r.blob();
        })
        .then((b) => {
          if (!cancelled) {
            object = URL.createObjectURL(b);
            setUrl(object);
          }
        })
        .catch(() => setBroken(true));
    } else if (safeUrl(normalized) || normalized.startsWith("/demo/"))
      setUrl(normalized);
    else setBroken(true);
    return () => {
      cancelled = true;
      if (object) URL.revokeObjectURL(object);
    };
  }, [src]);
  return url && !broken ? (
    <img src={url} alt={alt} loading="lazy" onError={() => setBroken(true)} />
  ) : (
    <>
      {fallback || (
        <div className="image-unavailable">
          <FileText size={24} />
          <span>Image unavailable</span>
        </div>
      )}
    </>
  );
}
function ActivityPage() {
  const [offset, setOffset] = useState(0);
  const { data, error } = useData(`/admin/audit?offset=${offset}&limit=30`);
  return (
    <>
      <PageTitle
        eyebrow="ACTIVITY LOG"
        title="A clear trail of important changes."
        description="Operator actions and access changes, recorded for accountability."
      />
      <Notice message={error} />
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Record</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {(data?.audit || []).map((a: Row) => (
                <tr key={a.id}>
                  <td>
                    <div className="activity-action">
                      <span>
                        <Shield size={17} />
                      </span>
                      <strong>
                        {String(a.action || a.eventType || "Update").replace(
                          /[_.]/g,
                          " ",
                        )}
                      </strong>
                    </div>
                  </td>
                  <td>{a.actorEmail || a.actorId?.slice(0, 8) || "System"}</td>
                  <td>
                    {a.targetType || a.resourceType || "—"}{" "}
                    {a.targetId?.slice(0, 8)}
                  </td>
                  <td>{date(a.createdAt, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data?.audit?.length && (
          <Empty
            title="No operator changes yet."
            body="Account suspensions and profile moderation appear here."
            icon={Shield}
          />
        )}
        <Pager
          total={Number(data?.total || 0)}
          offset={offset}
          setOffset={setOffset}
          limit={30}
        />
      </section>
    </>
  );
}
function AiPage() {
  const { data, error, loading, reload } = useData("/admin/ai/usage");
  const b = data?.budget || {};
  return (
    <>
      <PageTitle
        eyebrow="AI & USAGE"
        title="Helpful intelligence. Clear limits."
        description="Real provider activity, spending and reviewable suggestions."
      >
        <button className="button outline small" onClick={reload}>
          <RefreshCw size={15} /> Refresh
        </button>
      </PageTitle>
      <Notice message={error} />
      <div className="ai-summary">
        <div className="ai-orb">
          <Sparkles size={34} />
        </div>
        <div>
          <Tag tone={b.enabled ? "green" : "amber"}>
            {b.enabled ? "Provider enabled" : "Provider configuration required"}
          </Tag>
          <h2>
            AI lends a hand.
            <br />
            People make the call.
          </h2>
          <p>
            Extract a card, draft an introduction, remember a meeting.
            <br />
            Suggestions stay separate from confirmed facts.
          </p>
        </div>
      </div>
      <div className="stats-grid">
        <Stat
          label="Development budget"
          value={b.limitUsd || b.limit}
          description="USD · configured spending allowance"
          icon={Shield}
        />
        <Stat
          label="Recorded spend (USD)"
          value={Number(b.spentUsd || b.spent || 0).toFixed(4)}
          description="Completed provider requests"
          icon={Activity}
        />
        <Stat
          label="Reserved (USD)"
          value={Number(b.reservedUsd || b.reserved || 0).toFixed(4)}
          description="Held for requests in progress"
          icon={Clock3}
        />
        <Stat
          label="AI tasks"
          value={data?.jobs?.length || data?.usage?.totalJobs}
          description="No simulated production responses"
          icon={Sparkles}
        />
      </div>
      <section className="panel">
        <div className="panel-title">
          <div>
            <h3>Recent AI work</h3>
            <p>Task status and provider costs</p>
          </div>
          <Tag>Owner-reviewed output</Tag>
        </div>
        {loading && !data ? (
          <Loading />
        ) : (data?.jobs || []).length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Cost · USD</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.jobs.map((j: Row) => (
                  <tr key={j.id}>
                    <td>{String(j.task).replace(/_/g, " ")}</td>
                    <td>
                      <Tag
                        tone={
                          j.status === "completed"
                            ? "green"
                            : j.status === "failed"
                              ? "amber"
                              : ""
                        }
                      >
                        {j.status}
                      </Tag>
                    </td>
                    <td>{Number(j.costUsd || 0).toFixed(4)}</td>
                    <td>{date(j.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Ready when your provider is."
            body="Configure a key and approve a budget to test real AI. Ordinary profile and meeting tools work without it."
            icon={Sparkles}
          />
        )}
      </section>
    </>
  );
}
function OutboxPage() {
  const { data, error, reload } = useData("/admin/outbox?limit=50");
  const [selected, setSelected] = useState<Row | null>(null);
  return (
    <>
      <PageTitle
        eyebrow="LOCAL VERIFICATION"
        title="A transparent test delivery box."
        description="Local-only verification messages. Nothing here has been sent as email."
      >
        <button className="button outline small" onClick={reload}>
          <RefreshCw size={15} /> Refresh
        </button>
      </PageTitle>
      <div className="archive-intro">
        <LockKeyhole size={22} />
        <div>
          <strong>Development delivery, clearly labelled.</strong>
          <p>
            Use this only to test a recipient claim with the account owner.
            Configure a real mail provider before inviting outside recipients.
          </p>
        </div>
      </div>
      <Notice message={error} />
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Purpose</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(data?.messages || []).map((m: Row) => (
                <tr key={m.id} onClick={() => setSelected(m)}>
                  <td>
                    <div className="activity-action">
                      <Mail size={18} />
                      <strong>{m.recipient || m.email || m.toEmail}</strong>
                    </div>
                  </td>
                  <td>{m.subject || m.kind || "Verify profile ownership"}</td>
                  <td>{date(m.createdAt, true)}</td>
                  <td>
                    <ArrowUpRight size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data?.messages?.length && (
          <Empty
            title="No verification requests yet."
            body="Start a recipient claim to test this flow."
            icon={Inbox}
          />
        )}
      </section>
      {selected && (
        <Modal
          title="Local verification message"
          onClose={() => setSelected(null)}
        >
          <Tag tone="amber">Not sent as email</Tag>
          <dl className="definition">
            <dt>To</dt>
            <dd>{selected.recipient || selected.email || selected.toEmail}</dd>
            <dt>Created</dt>
            <dd>{date(selected.createdAt, true)}</dd>
          </dl>
          <pre className="outbox-body">
            {typeof selected.body === "string"
              ? selected.body
              : JSON.stringify(
                  selected.body || selected.payload || selected,
                  null,
                  2,
                )}
          </pre>
        </Modal>
      )}
    </>
  );
}
