import React, { useEffect, useState } from "react";
import { View, Pressable, Text, Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import { get, post, patch } from "./api";
import { usePilot } from "./store";
import {
  Sheet,
  Title,
  Body,
  Label,
  Button,
  Field,
  Avatar,
  Pill as Choice,
  Empty,
  C,
  s,
  Icon,
} from "./ui";
const Pill = ({
  label,
  ...props
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) => <Choice {...props}>{label}</Choice>;
type Row = Record<string, any>;
const box = {
  backgroundColor: C.white,
  borderWidth: 1,
  borderColor: C.line,
  borderRadius: 18,
  padding: 18,
  marginBottom: 14,
};
export function BusinessDashboard({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { refresh, notify } = usePilot();
  const [companies, setCompanies] = useState<Row[]>([]),
    [detail, setDetail] = useState<Row | null>(null),
    [tab, setTab] = useState("team"),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [claim, setClaim] = useState(false),
    [code, setCode] = useState(""),
    [adding, setAdding] = useState(false),
    [invitation, setInvitation] = useState(""),
    [lead, setLead] = useState<Row | null>(null),
    [employee, setEmployee] = useState<Row | null>(null);
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [title, setTitle] = useState(""),
    [department, setDepartment] = useState("");
  async function load(id?: string) {
    const list = await get("/business/companies");
    setCompanies(list.companies);
    if (id) setDetail(await get(`/business/companies/${id}`));
    else if (list.companies.length === 1)
      setDetail(await get(`/business/companies/${list.companies[0].id}`));
  }
  async function run(fn: () => Promise<void>) {
    setLoading(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your business");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (visible) {
      setDetail(null);
      setTab("team");
      setLead(null);
      setEmployee(null);
      setAdding(false);
      setClaim(false);
      setInvitation("");
      void run(() => load());
    }
  }, [visible]);
  const company = detail?.company;
  const manager = detail && ["owner", "manager"].includes(detail.myRole);
  function close() {
    setError("");
    if (lead) setLead(null);
    else if (employee) setEmployee(null);
    else if (adding) {
      setAdding(false);
      setInvitation("");
    } else if (claim) setClaim(false);
    else onClose();
  }
  async function updateLead(status: string, assignedMemberId: string | null) {
    if (!detail || !lead) return;
    await patch(`/business/companies/${company.id}/leads/${lead.id}`, {
      status,
      assignedMemberId,
    });
    setLead({ ...lead, status, assignedMemberId });
    await load(company.id);
  }
  return (
    <Sheet
      visible={visible}
      title={
        claim
          ? "Accept invitation"
          : adding
            ? "Invite a teammate"
            : lead
              ? lead.name
              : employee
                ? employee.name
                : "My business"
      }
      subtitle={
        !claim && !adding && !lead && !employee
          ? "Your people. Your cards. Your next customers."
          : undefined
      }
      onClose={close}
    >
      {error && (
        <View style={[box, { backgroundColor: "#fff0e6" }]}>
          <Body>{error}</Body>
          <Button
            tone="quiet"
            small
            onPress={() => void run(() => load(company?.id))}
          >
            Try again
          </Button>
        </View>
      )}
      {claim ? (
        <>
          <Body>
            Use the invitation code from your company or DUIT admin. Sign in
            with the mobile number they invited.
          </Body>
          <Field
            label="Invitation code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
          />
          <Button
            busy={loading}
            disabled={!code.trim()}
            onPress={() =>
              void run(async () => {
                await post("/business/claim", { invitationCode: code.trim() });
                await refresh();
                await load();
                setClaim(false);
                setCode("");
                notify("Your card is ready to review in My card.");
              })
            }
          >
            Accept invitation
          </Button>
        </>
      ) : adding ? (
        <>
          {invitation ? (
            <>
              <Title size={25}>Ready to join.</Title>
              <Body style={{ marginVertical: 18 }}>
                Send this code to {name}. They can accept it in My card → My
                business after verifying their mobile number.
              </Body>
              <View style={box}>
                <Text selectable style={{ color: C.ink, fontSize: 15 }}>
                  {invitation}
                </Text>
              </View>
              <Button
                onPress={() =>
                  void Clipboard.setStringAsync(invitation).then(() =>
                    notify("Invitation copied"),
                  )
                }
              >
                Copy invitation
              </Button>
              <Body muted style={{ marginTop: 14 }}>
                Valid for 7 days. Their card will start as a draft.
              </Body>
            </>
          ) : (
            <>
              <Field label="Full name" value={name} onChangeText={setName} />
              <Field
                label="Mobile with country code"
                placeholder="+91…"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Field label="Job title" value={title} onChangeText={setTitle} />
              <Field
                label="Department"
                value={department}
                onChangeText={setDepartment}
              />
              <Button
                busy={loading}
                disabled={!name.trim() || !phone.trim()}
                onPress={() =>
                  void run(async () => {
                    const d = await post("/business/onboarding", {
                      companyId: company.id,
                      name,
                      phone,
                      title,
                      department,
                      role: "member",
                    });
                    setInvitation(d.invitationCode);
                    await load(company.id);
                  })
                }
              >
                Create invitation
              </Button>
            </>
          )}
        </>
      ) : employee ? (
        <>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Avatar
              url={employee.profile?.photoUrl}
              name={employee.name}
              size={86}
            />
            <Title size={25} style={{ marginTop: 15 }}>
              {employee.name}
            </Title>
            <Body muted>
              {employee.role} · {employee.status}
            </Body>
          </View>
          <Field
            label="Job title"
            value={title}
            onChangeText={setTitle}
            editable={
              !!manager &&
              employee.role !== "owner" &&
              employee.status !== "pending"
            }
          />
          <Field
            label="Department"
            value={department}
            onChangeText={setDepartment}
            editable={
              !!manager &&
              employee.role !== "owner" &&
              employee.status !== "pending"
            }
          />
          {employee.status === "pending" ? (
            <Button
              busy={loading}
              onPress={() =>
                void run(async () => {
                  const d = await post(
                    `/business/members/${employee.id}/invitation`,
                    {},
                  );
                  await Clipboard.setStringAsync(d.invitationCode);
                  notify("New invitation copied. Previous code has expired.");
                })
              }
            >
              Copy new invitation
            </Button>
          ) : employee.role !== "owner" && manager ? (
            <>
              <Button
                busy={loading}
                onPress={() =>
                  void run(async () => {
                    await patch(
                      `/business/companies/${company.id}/members/${employee.id}`,
                      { status: employee.status, title, department },
                    );
                    await load(company.id);
                    setEmployee(null);
                  })
                }
              >
                Save team details
              </Button>
              <Button
                tone="quiet"
                busy={loading}
                onPress={() =>
                  void run(async () => {
                    await patch(
                      `/business/companies/${company.id}/members/${employee.id}`,
                      {
                        status:
                          employee.status === "active" ? "paused" : "active",
                        title,
                        department,
                      },
                    );
                    await load(company.id);
                    setEmployee(null);
                  })
                }
              >
                {employee.status === "active"
                  ? "Pause company access"
                  : "Restore company access"}
              </Button>
              <Body muted>
                Pausing removes company access and takes company cards offline.
                It does not affect their personal DUIT account.
              </Body>
            </>
          ) : (
            <Body muted>
              {employee.role === "owner"
                ? "Company owner. Contact DUIT to change ownership."
                : "Your company manager maintains these team details."}
            </Body>
          )}
        </>
      ) : lead ? (
        <>
          <Label>{lead.cardTitle}</Label>
          <Body style={{ fontSize: 21, marginVertical: 20 }}>
            {lead.intent || "Would like to talk about your business."}
          </Body>
          <Body muted>{new Date(lead.createdAt).toLocaleString()}</Body>
          {lead.email && <Body style={{ marginTop: 12 }}>{lead.email}</Body>}
          {lead.phone && <Body>{lead.phone}</Body>}
          <View style={{ height: 25 }} />
          <Label>Progress</Label>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginVertical: 12,
            }}
          >
            {["new", "responded", "qualified", "closed"].map((status) => (
              <Pill
                key={status}
                active={lead.status === status}
                label={status}
                onPress={
                  manager && !loading
                    ? () =>
                        void run(() =>
                          updateLead(status, lead.assignedMemberId),
                        )
                    : undefined
                }
              />
            ))}
          </View>
          {manager && (
            <>
              <Label>Assign to</Label>
              <View style={{ gap: 8, marginTop: 12 }}>
                <Button
                  small
                  tone={!lead.assignedMemberId ? "primary" : "secondary"}
                  disabled={loading}
                  onPress={() => void run(() => updateLead(lead.status, null))}
                >
                  Unassigned
                </Button>
                {detail.members
                  .filter((m: Row) => m.status === "active")
                  .map((m: Row) => (
                    <Button
                      key={m.id}
                      small
                      disabled={loading}
                      tone={
                        lead.assignedMemberId === m.id ? "primary" : "secondary"
                      }
                      onPress={() =>
                        void run(() => updateLead(lead.status, m.id))
                      }
                    >
                      {m.name}
                    </Button>
                  ))}
              </View>
            </>
          )}
        </>
      ) : (
        <>
          {companies.length > 1 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {companies.map((c) => (
                <Pill
                  key={c.id}
                  label={c.name}
                  active={company?.id === c.id}
                  onPress={() => void run(() => load(c.id))}
                />
              ))}
            </View>
          )}
          {detail ? (
            <>
              <View
                style={{
                  backgroundColor: C.ink,
                  padding: 24,
                  borderRadius: 22,
                  marginBottom: 24,
                }}
              >
                <Label color="#cfe990">
                  {company.industry || "YOUR BUSINESS"}
                </Label>
                <Title size={29} style={{ color: C.white, marginVertical: 12 }}>
                  {company.name}
                </Title>
                <Body style={{ color: "#d7e3dc", fontSize: 14 }}>
                  {company.description}
                </Body>
                <View style={{ flexDirection: "row", gap: 26, marginTop: 22 }}>
                  {[
                    [detail.members.length, "People"],
                    [
                      detail.cards.filter((c: Row) => c.isPublished).length,
                      "Live cards",
                    ],
                    [detail.totals?.newEnquiries || 0, "New leads"],
                  ].map(([n, label]) => (
                    <View key={label}>
                      <Text style={{ color: C.white, fontSize: 28 }}>{n}</Text>
                      <Text
                        style={{ color: "#bacdc2", fontSize: 12, marginTop: 4 }}
                      >
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 22 }}>
                {["team", "cards", "leads", "company"].map((t) => (
                  <Pill
                    key={t}
                    label={
                      t === "team"
                        ? "People"
                        : t === "cards"
                          ? "Cards"
                          : t === "leads"
                            ? "Enquiries"
                            : "Company"
                    }
                    active={tab === t}
                    onPress={() => setTab(t)}
                  />
                ))}
              </View>
              {tab === "company" && (
                <View style={box}>
                  <Label>SHARED COMPANY PROFILE</Label>
                  <Title size={24} style={{ marginVertical: 14 }}>
                    {company.name}
                  </Title>
                  <Body>{company.description}</Body>
                  {company.website && (
                    <Body style={{ marginTop: 20 }}>{company.website}</Body>
                  )}
                  {company.address && (
                    <>
                      <View style={{ height: 20 }} />
                      <Label>ADDRESS</Label>
                      <Body style={{ marginTop: 8 }}>{company.address}</Body>
                    </>
                  )}
                  <Body muted style={{ fontSize: 12, marginTop: 22 }}>
                    Every teammate links to this company. Published cards keep
                    their approved content until the owner republishes.
                  </Body>
                </View>
              )}
              {tab === "team" && (
                <>
                  {manager && (
                    <Button
                      tone="secondary"
                      icon="person-add-outline"
                      style={{ marginBottom: 18 }}
                      onPress={() => {
                        setName("");
                        setPhone("");
                        setTitle("");
                        setDepartment("");
                        setInvitation("");
                        setAdding(true);
                      }}
                    >
                      Invite teammate
                    </Button>
                  )}
                  {detail.members.map((m: Row) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Manage ${m.name}`}
                      key={m.id}
                      onPress={() => {
                        setEmployee(m);
                        setTitle(m.title);
                        setDepartment(m.department);
                      }}
                      style={[
                        box,
                        { flexDirection: "row", gap: 13, alignItems: "center" },
                      ]}
                    >
                      <Avatar
                        url={m.profile?.photoUrl}
                        name={m.name}
                        size={51}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 17,
                            fontWeight: "600",
                            color: C.ink,
                          }}
                        >
                          {m.name}
                        </Text>
                        <Body muted style={{ fontSize: 12, marginTop: 4 }}>
                          {m.title || m.role}
                        </Body>
                        <Text
                          style={{ color: C.muted, fontSize: 11, marginTop: 5 }}
                        >
                          {m.status === "pending"
                            ? "Invitation pending"
                            : `${m.liveCards} live cards · ${m.department || m.role}`}
                        </Text>
                      </View>
                      <Icon name="chevron-forward" size={18} />
                    </Pressable>
                  ))}
                </>
              )}
              {tab === "cards" && (
                <>
                  {detail.cards.map((c: Row) => (
                    <View style={box} key={c.id}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <Avatar url={c.imageUrl} name={c.title} size={48} />
                        <View style={{ flex: 1 }}>
                          <Title size={20}>{c.title}</Title>
                          <Body muted style={{ fontSize: 12 }}>
                            {c.role}
                          </Body>
                        </View>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 16,
                          marginVertical: 17,
                        }}
                      >
                        <Body muted>{c.views} views</Body>
                        <Body muted>{c.leads} enquiries</Body>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Label>
                          {c.isPublished ? "LIVE" : "DRAFT / PAUSED"}
                        </Label>
                        {manager && c.isPublished && (
                          <Button
                            tone="quiet"
                            small
                            busy={loading}
                            onPress={() =>
                              void run(async () => {
                                await post(
                                  `/business/companies/${company.id}/cards/${c.id}/pause`,
                                  {},
                                );
                                await load(company.id);
                              })
                            }
                          >
                            Pause card
                          </Button>
                        )}
                      </View>
                    </View>
                  ))}
                  {!detail.cards.length && (
                    <Body muted>
                      Company cards appear after your teammates accept their
                      invitations.
                    </Body>
                  )}
                </>
              )}
              {tab === "leads" && (
                <>
                  {detail.leads.map((l: Row) => (
                    <Pressable
                      key={l.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Enquiry from ${l.name}`}
                      onPress={() => setLead(l)}
                      style={box}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Title size={20}>{l.name}</Title>
                        <Label>{l.status}</Label>
                      </View>
                      <Body style={{ fontSize: 14, marginVertical: 10 }}>
                        {l.intent || "Would like to connect"}
                      </Body>
                      <Body muted style={{ fontSize: 11 }}>
                        {l.cardTitle} ·{" "}
                        {new Date(l.createdAt).toLocaleDateString()}
                      </Body>
                      <Body muted style={{ fontSize: 11, marginTop: 7 }}>
                        {detail.members.find(
                          (m: Row) => m.id === l.assignedMemberId,
                        )?.name || "Not assigned yet"}
                      </Body>
                    </Pressable>
                  ))}
                  {!detail.leads.length && (
                    <Empty
                      icon="mail-outline"
                      title="Your next conversation starts here"
                      body="Enquiries from company cards arrive here, ready for the right teammate."
                    />
                  )}
                </>
              )}
              <Body muted style={{ fontSize: 11, marginTop: 20 }}>
                Only company-linked cards and enquiries appear here. Your team's
                personal contacts and notes stay private.
              </Body>
            </>
          ) : loading ? (
            <Body>Loading your business…</Body>
          ) : (
            <Empty
              icon="business-outline"
              title="Better together."
              body="Your company and its people, in one place. Accept an invitation from your company or DUIT admin to get started."
            />
          )}
          <View style={{ marginTop: 25 }}>
            <Button
              tone="quiet"
              icon="key-outline"
              onPress={() => setClaim(true)}
            >
              Accept invitation
            </Button>
          </View>
        </>
      )}
    </Sheet>
  );
}
