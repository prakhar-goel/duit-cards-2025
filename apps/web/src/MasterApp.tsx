import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Users,
  Plus,
  Search,
  ArrowLeft,
  Check,
  Copy,
  LogOut,
  CreditCard,
  Inbox,
  X,
} from "lucide-react";
import { api, post, patch, session, saveSession, type Row } from "./api";
import "./master.css";
const blankCompany = {
  name: "",
  industry: "",
  description: "",
  website: "",
  address: "",
  logoUrl: "",
};
const blankPerson = {
  name: "",
  phone: "",
  email: "",
  title: "",
  department: "",
  bio: "",
  photoUrl: "",
  businessCardUrl: "",
  role: "member",
};
function Photo({ person }: { person: Row }) {
  const original = person.profile?.photoUrl;
  const privateMedia =
    /\/api\/v1\/(?:(?:public\/)?media\/|business\/members\/)/.test(
      original || "",
    );
  const [blob, setBlob] = useState("");
  useEffect(() => {
    if (!privateMedia) return;
    let active = true,
      objectUrl = "";
    fetch(`/api/v1/business/members/${person.id}/photo`, {
      headers: { Authorization: `Bearer ${session()?.accessToken}` },
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.blob();
      })
      .then((b) => {
        objectUrl = URL.createObjectURL(b);
        if (active) setBlob(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [original, person.id, privateMedia]);
  const url = privateMedia ? blob : original;
  return url ? (
    <img className="m-avatar" src={url} alt="" />
  ) : (
    <span className="m-avatar m-initial">
      {(person.name || "?")
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export default function MasterApp() {
  const [auth, setAuth] = useState(session()),
    [companies, setCompanies] = useState<Row[]>([]),
    [people, setPeople] = useState<Row[]>([]),
    [selected, setSelected] = useState<Row | null>(null),
    [tab, setTab] = useState("team"),
    [page, setPage] = useState("companies"),
    [modal, setModal] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [invite, setInvite] = useState(""),
    [copied, setCopied] = useState(false);
  const [company, setCompany] = useState(blankCompany),
    [person, setPerson] = useState(blankPerson),
    [companyId, setCompanyId] = useState(""),
    [accounts, setAccounts] = useState<Row[]>([]),
    [accountSearch, setAccountSearch] = useState(""),
    [linkRole, setLinkRole] = useState("member");
  async function uploadImage(
    file: File,
    field: "photoUrl" | "businessCardUrl",
  ) {
    await run(async () => {
      if (file.size > 8 * 1024 * 1024)
        throw new Error("Choose an image smaller than 8 MB.");
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("Choose a JPG, PNG or WebP image.");
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const d = await post("/media", {
        filename: file.name,
        mimeType: file.type,
        data,
        purpose: field === "photoUrl" ? "portrait" : "business_card",
      });
      setPerson((p) => ({ ...p, [field]: d.media.url }));
    });
  }
  async function refresh(id?: string) {
    const [c, p] = await Promise.all([
      api("/business/companies"),
      api("/business/onboarding"),
    ]);
    setCompanies(c.companies);
    setPeople(p.people);
    if (id) setSelected(await api(`/business/companies/${id}`));
  }
  useEffect(() => {
    if (auth?.user?.role === "admin")
      refresh().catch((e) => setError(e.message));
  }, [auth]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again");
    } finally {
      setBusy(false);
    }
  }
  const open = (kind: string) => {
    setError("");
    setInvite("");
    setCopied(false);
    setModal(kind);
    if (kind === "company") setCompany(blankCompany);
    if (kind === "person") {
      setPerson(blankPerson);
      setCompanyId(selected?.company.id || "");
    }
  };
  if (!auth || auth.user.role !== "admin")
    return (
      <div className="master m-login">
        <div className="m-brand">
          duit<span>master</span>
        </div>
        <div className="m-login-card">
          <p className="m-eyebrow">PLATFORM OPERATIONS</p>
          <h1>
            A good introduction
            <br />
            starts here.
          </h1>
          <p>
            Set up people, bring their teams together, and give every business a
            place to grow.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              void run(async () => {
                const value = await post("/auth/login", {
                  email: d.get("email"),
                  password: d.get("password"),
                });
                if (value.user.role !== "admin")
                  throw new Error("Use your DUIT administrator account.");
                saveSession(value);
                setAuth(value);
              });
            }}
          >
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button disabled={busy}>
              Sign in <ArrowUpRight size={18} />
            </button>
          </form>
          {error && <p role="alert">{error}</p>}
        </div>
      </div>
    );
  const current = selected?.company;
  const filteredCompanies = companies.filter((c) =>
    (c.name + " " + c.industry).toLowerCase().includes(search.toLowerCase()),
  );
  const filteredPeople = people.filter((p) =>
    (p.name + " " + (p.companyName || ""))
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="master">
      <aside className="m-side">
        <div className="m-brand">
          duit<span>master</span>
        </div>
        <p className="m-eyebrow">A BETTER FIRST HELLO</p>
        <nav>
          <button
            className={page === "companies" ? "active" : ""}
            onClick={() => {
              setPage("companies");
              setSelected(null);
              setSearch("");
            }}
          >
            <Building2 size={19} />
            Companies
          </button>
          <button
            className={page === "people" ? "active" : ""}
            onClick={() => {
              setPage("people");
              setSelected(null);
              setSearch("");
            }}
          >
            <Users size={19} />
            People
          </button>
        </nav>
        <div className="m-side-bottom">
          <a href="/admin">
            Platform overview <ArrowUpRight size={16} />
          </a>
          <button
            onClick={() => {
              saveSession(null);
              setAuth(null);
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="m-main">
        <header className="m-top">
          <span>DUIT / WORKSPACE</span>
          <span className="m-operator">● Platform admin</span>
        </header>
        {error && (
          <div className="m-error" role="alert">
            {error}
            <button onClick={() => setError("")} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}
        {selected ? (
          <>
            <button className="m-text" onClick={() => setSelected(null)}>
              <ArrowLeft size={16} /> All companies
            </button>
            <div className="m-heading">
              <div>
                <p className="m-eyebrow">{current.industry || "COMPANY"}</p>
                <h1>{current.name}</h1>
                <p>{current.description}</p>
              </div>
              <button onClick={() => open("person")}>
                <Plus size={18} /> Add person
              </button>
            </div>
            <div className="m-metrics">
              <div>
                <b>{selected.members.length}</b>
                <span>People</span>
              </div>
              <div>
                <b>{selected.cards.filter((c: Row) => c.isPublished).length}</b>
                <span>Live cards</span>
              </div>
              <div>
                <b>
                  {selected.cards.reduce((n: number, c: Row) => n + c.views, 0)}
                </b>
                <span>Card views</span>
              </div>
              <div>
                <b>{selected.leads.length}</b>
                <span>Recent enquiries</span>
              </div>
            </div>
            <div className="m-tabs">
              {["team", "cards", "enquiries", "company"].map((t) => (
                <button
                  key={t}
                  className={tab === t ? "active" : ""}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {tab === "team" && (
              <>
                <div className="m-section-title">
                  <h2>The people behind the business</h2>
                  <button
                    className="m-text"
                    onClick={() => {
                      setAccounts([]);
                      setAccountSearch("");
                      open("link");
                    }}
                  >
                    Link existing account <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="m-team-grid">
                  {selected.members.map((m: Row) => (
                    <article key={m.id} className="m-person">
                      <div className="m-person-top">
                        <Photo person={m} />
                        <span className={"m-pill " + m.status}>
                          {m.status === "pending" ? "Invited" : m.status}
                        </span>
                      </div>
                      <h3>{m.name}</h3>
                      <p>{m.title || "Team member"}</p>
                      <small>
                        {m.department || "Team"} · {m.role}
                      </small>
                      <div className="m-person-foot">
                        <span>
                          {m.cards} cards · {m.liveCards} live
                        </span>
                        {m.status === "pending" ? (
                          <button
                            className="m-text"
                            onClick={() =>
                              void run(async () => {
                                const d = await post(
                                  `/business/members/${m.id}/invitation`,
                                  {},
                                );
                                setInvite(d.invitationCode);
                                setModal("invitation");
                              })
                            }
                          >
                            Invitation <ArrowUpRight size={15} />
                          </button>
                        ) : (
                          <Check size={18} />
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                {!selected.members.length && (
                  <div className="m-empty">
                    Add the first person, or link an existing DUIT account.
                  </div>
                )}
              </>
            )}
            {tab === "cards" && (
              <div className="m-team-grid">
                {selected.cards.map((c: Row) => (
                  <article className="m-person" key={c.id}>
                    <p className="m-eyebrow">{current.name}</p>
                    <h2>{c.title}</h2>
                    <p>{c.role}</p>
                    <span
                      className={
                        "m-pill " + (c.isPublished ? "active" : "pending")
                      }
                    >
                      {c.isPublished ? "Live" : "Draft / paused"}
                    </span>
                    <div className="m-person-foot">
                      <span>
                        {c.views} views · {c.leads} enquiries
                      </span>
                      {c.isPublished && (
                        <button
                          className="m-text"
                          onClick={() =>
                            void run(async () => {
                              await post(
                                `/business/companies/${current.id}/cards/${c.id}/pause`,
                                {},
                              );
                              await refresh(current.id);
                            })
                          }
                        >
                          Pause
                        </button>
                      )}
                    </div>
                  </article>
                ))}
                {!selected.cards.length && (
                  <div className="m-empty">
                    Cards appear here when an invitation is accepted or an
                    existing card is linked.
                  </div>
                )}
              </div>
            )}
            {tab === "enquiries" && (
              <div className="m-leads">
                {selected.leads.map((l: Row) => (
                  <article key={l.id}>
                    <div>
                      <h3>{l.name}</h3>
                      <p>{l.intent || "Would like to connect"}</p>
                      <small>
                        {l.cardTitle} ·{" "}
                        {new Date(l.createdAt).toLocaleDateString()}
                      </small>
                      <p>{l.email || l.phone}</p>
                    </div>
                    <div className="m-lead-actions">
                      <select
                        aria-label={`Status for ${l.name}`}
                        value={l.status}
                        disabled={busy}
                        onChange={(e) =>
                          void run(async () => {
                            await patch(
                              `/business/companies/${current.id}/leads/${l.id}`,
                              {
                                status: e.target.value,
                                assignedMemberId: l.assignedMemberId,
                              },
                            );
                            await refresh(current.id);
                          })
                        }
                      >
                        {["new", "responded", "qualified", "closed"].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                      <select
                        aria-label={`Assign ${l.name}`}
                        value={l.assignedMemberId || ""}
                        disabled={busy}
                        onChange={(e) =>
                          void run(async () => {
                            await patch(
                              `/business/companies/${current.id}/leads/${l.id}`,
                              {
                                status: l.status,
                                assignedMemberId: e.target.value || null,
                              },
                            );
                            await refresh(current.id);
                          })
                        }
                      >
                        <option value="">Unassigned</option>
                        {selected.members
                          .filter((m: Row) => m.status === "active")
                          .map((m: Row) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </article>
                ))}
                {!selected.leads.length && (
                  <div className="m-empty">
                    Enquiries from your team's business cards will arrive here.
                  </div>
                )}
              </div>
            )}
            {tab === "company" && (
              <article className="m-company-about">
                {current.logoUrl && (
                  <img src={current.logoUrl} alt="Company logo" />
                )}
                <h2>One business. Many introductions.</h2>
                <p>{current.description}</p>
                <p>{current.website}</p>
                <p>{current.address}</p>
                <button
                  onClick={() => {
                    setCompany({ ...blankCompany, ...current });
                    setModal("edit-company");
                  }}
                >
                  Edit shared profile
                </button>
                <small>
                  Shared information is available to the whole team. Published
                  cards keep their reviewed content until their owner
                  republishes.
                </small>
              </article>
            )}
          </>
        ) : (
          <>
            <div className="m-heading">
              <div>
                <p className="m-eyebrow">BRING PEOPLE ON BOARD</p>
                <h1>
                  {page === "companies"
                    ? "Good businesses.\nGreat people."
                    : "Every person,\na new possibility."}
                </h1>
                <p>
                  {page === "companies"
                    ? "One company profile. A card for everyone who represents it."
                    : "Prepare their introduction. Let them make it their own."}
                </p>
              </div>
              <button
                onClick={() =>
                  open(page === "companies" ? "company" : "person")
                }
              >
                <Plus size={18} />
                {page === "companies" ? "Add company" : "Onboard person"}
              </button>
            </div>
            <div className="m-metrics">
              <div>
                <b>{companies.length}</b>
                <span>Companies</span>
              </div>
              <div>
                <b>{people.length}</b>
                <span>People onboarded</span>
              </div>
              <div>
                <b>{people.filter((p) => p.status === "pending").length}</b>
                <span>Awaiting acceptance</span>
              </div>
            </div>
            <div className="m-search">
              <Search size={19} />
              <input
                aria-label="Search companies or people"
                placeholder={
                  page === "companies" ? "Find a company…" : "Find a person…"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {page === "companies" ? (
              <div className="m-company-grid">
                {filteredCompanies.map((c) => (
                  <button
                    key={c.id}
                    className="m-company-card"
                    onClick={() =>
                      void run(async () => {
                        setSelected(await api(`/business/companies/${c.id}`));
                        setTab("team");
                      })
                    }
                  >
                    <div className="m-company-icon">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt="" />
                      ) : (
                        <Building2 size={27} />
                      )}
                      <ArrowUpRight size={23} />
                    </div>
                    <p className="m-eyebrow">{c.industry || "BUSINESS"}</p>
                    <h2>{c.name}</h2>
                    <p>
                      {c.description ||
                        "A new business, ready for its first introduction."}
                    </p>
                    <footer>
                      <span>
                        <Users size={16} /> {c.members} people
                      </span>
                      <span>
                        <CreditCard size={16} /> {c.cards} cards
                      </span>
                    </footer>
                  </button>
                ))}
              </div>
            ) : (
              <div className="m-team-grid">
                {filteredPeople.map((p) => (
                  <article key={p.id} className="m-person">
                    <div className="m-person-top">
                      <Photo person={p} />
                      <span className={"m-pill " + p.status}>{p.status}</span>
                    </div>
                    <h3>{p.name}</h3>
                    <p>{p.title}</p>
                    <small>{p.companyName || "Independent professional"}</small>
                    {p.status === "pending" && (
                      <div className="m-person-foot">
                        <button
                          className="m-text"
                          onClick={() =>
                            void run(async () => {
                              const d = await post(
                                `/business/members/${p.id}/invitation`,
                                {},
                              );
                              setInvite(d.invitationCode);
                              setModal("invitation");
                            })
                          }
                        >
                          Get invitation <ArrowUpRight size={16} />
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
            {!(page === "companies" ? filteredCompanies : filteredPeople)
              .length && (
              <div className="m-empty">
                Start with a company or a person. Their cards will grow from
                here.
              </div>
            )}
          </>
        )}
        <p className="m-scope">
          <Inbox size={15} /> Company enquiries and company cards only. Personal
          contacts and meeting notes stay private.
        </p>
      </main>
      {modal && (
        <div className="m-overlay">
          <section
            className="m-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Onboarding"
          >
            <button
              className="m-close"
              aria-label="Close onboarding"
              onClick={() => setModal("")}
            >
              <X />
            </button>
            {error && (
              <div className="m-error" role="alert">
                {error}
              </div>
            )}
            {invite ? (
              <>
                <p className="m-eyebrow">READY FOR THEIR FIRST HELLO</p>
                <h2>Their invitation is ready.</h2>
                <p>
                  Send this code to the person you invited. In DUIT, they sign
                  in with their mobile number, open My card → My business →
                  Accept invitation.
                </p>
                <code className="m-code">{invite}</code>
                <button
                  onClick={() =>
                    void run(async () => {
                      await navigator.clipboard.writeText(invite);
                      setCopied(true);
                    })
                  }
                >
                  <Copy size={17} />
                  {copied ? "Copied" : "Copy invitation"}
                </button>
                <p className="m-hint">
                  Valid for 7 days. Only the invited mobile number can accept
                  it. Their card stays a draft until they review and publish.
                </p>
              </>
            ) : modal === "company" || modal === "edit-company" ? (
              <>
                <p className="m-eyebrow">THE BUSINESS BEHIND THE CARD</p>
                <h2>
                  {modal === "company"
                    ? "Add a company"
                    : "Shared company profile"}
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () => {
                      const d =
                        modal === "company"
                          ? await post("/business/companies", company)
                          : await patch(
                              `/business/companies/${current.id}`,
                              company,
                            );
                      await refresh(d.company.id);
                      setModal("");
                      setTab("team");
                    });
                  }}
                >
                  {[
                    ["name", "Company name"],
                    ["industry", "Industry"],
                    ["website", "Website"],
                    ["address", "Business address"],
                    ["logoUrl", "Logo image URL"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        required={key === "name"}
                        type={
                          key === "website" || key === "logoUrl"
                            ? "url"
                            : "text"
                        }
                        value={(company as Row)[key]}
                        onChange={(e) =>
                          setCompany({ ...company, [key]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                  <label>
                    What does the business do?
                    <textarea
                      value={company.description}
                      onChange={(e) =>
                        setCompany({ ...company, description: e.target.value })
                      }
                    />
                  </label>
                  <button disabled={busy}>
                    {busy ? "Saving…" : "Save company"}
                    <ArrowUpRight size={17} />
                  </button>
                </form>
              </>
            ) : modal === "person" ? (
              <>
                <p className="m-eyebrow">A PERSONAL INTRODUCTION</p>
                <h2>Onboard someone.</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () => {
                      const d = await post("/business/onboarding", {
                        ...person,
                        companyId: companyId || null,
                      });
                      setInvite(d.invitationCode);
                      await refresh(current?.id);
                    });
                  }}
                >
                  <label>
                    Company
                    <select
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                    >
                      <option value="">Independent professional</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="m-form-grid">
                    {[
                      ["name", "Full name"],
                      ["title", "Job title"],
                      ["phone", "Mobile with country code"],
                      ["email", "Email (optional)"],
                      ["department", "Department"],
                    ].map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          required={key === "name" || key === "phone"}
                          type={
                            key === "email"
                              ? "email"
                              : key.includes("Url")
                                ? "url"
                                : "text"
                          }
                          placeholder={key === "phone" ? "+91…" : undefined}
                          value={(person as Row)[key]}
                          onChange={(e) =>
                            setPerson({ ...person, [key]: e.target.value })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div className="m-form-grid">
                    <label>
                      Profile photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={busy}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadImage(f, "photoUrl");
                        }}
                      />
                      {person.photoUrl && <small>Photo attached ✓</small>}
                    </label>
                    <label>
                      Visiting card
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={busy}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadImage(f, "businessCardUrl");
                        }}
                      />
                      {person.businessCardUrl && <small>Card attached ✓</small>}
                    </label>
                  </div>
                  {companyId && (
                    <label>
                      Company access
                      <select
                        value={person.role}
                        onChange={(e) =>
                          setPerson({ ...person, role: e.target.value })
                        }
                      >
                        <option value="member">
                          Employee · own business card
                        </option>
                        <option value="manager">
                          Manager · team cards and enquiries
                        </option>
                        <option value="owner">Owner · company and team</option>
                      </select>
                    </label>
                  )}
                  <label>
                    A short introduction
                    <textarea
                      value={person.bio}
                      onChange={(e) =>
                        setPerson({ ...person, bio: e.target.value })
                      }
                    />
                  </label>
                  <div className="m-mini-card">
                    <b>{person.name || "Their name"}</b>
                    <span>{person.title || "Their role"}</span>
                    <strong>
                      {companies.find((c) => c.id === companyId)?.name ||
                        "Independent professional"}
                    </strong>
                  </div>
                  <button disabled={busy}>
                    {busy ? "Preparing…" : "Create invitation"}
                    <ArrowUpRight size={17} />
                  </button>
                </form>
              </>
            ) : modal === "link" ? (
              <>
                <p className="m-eyebrow">ALREADY ON DUIT</p>
                <h2>Link an existing account</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () => {
                      const d = await api(
                        "/business/accounts?search=" +
                          encodeURIComponent(accountSearch),
                      );
                      setAccounts(d.accounts);
                    });
                  }}
                >
                  <label>
                    Find by name or email
                    <input
                      required
                      minLength={2}
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                    />
                  </label>
                  <button disabled={busy}>Search</button>
                </form>
                <label>
                  Company access
                  <select
                    value={linkRole}
                    onChange={(e) => setLinkRole(e.target.value)}
                  >
                    <option value="member">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </label>
                {accounts.map((a) => (
                  <div className="m-account" key={a.id}>
                    <b>{a.displayName}</b>
                    <small>{a.email}</small>
                    {[
                      ...a.cards,
                      { id: null, title: "Link account without a card" },
                    ].map((c: Row) => (
                      <button
                        className="m-text"
                        key={c.id || "none"}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await post(
                              `/business/companies/${current.id}/link`,
                              {
                                userId: a.id,
                                ...(c.id ? { cardId: c.id } : {}),
                                role: linkRole,
                              },
                            );
                            await refresh(current.id);
                            setModal("");
                          })
                        }
                      >
                        {c.title}
                        <Plus size={15} />
                      </button>
                    ))}
                  </div>
                ))}
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
