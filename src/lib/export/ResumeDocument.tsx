import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Local mirror of the structured resume shape. We don't import the edge-
// shared Zod type here because supabase/functions/ is excluded from the Vite
// tsconfig — these are plain objects read off the row's `structured` jsonb.
// Every list field is optional here because a rawTextOnly soft-fail resume
// may omit them; the component guards each section.
export type ResumeExperience = {
  company?: string;
  role?: string;
  dates?: string;
  bullets?: string[];
  metrics?: string[];
};

export type ResumeProject = {
  name?: string;
  link?: string;
  stack?: string;
  bullets?: string[];
};

export type ResumeEducation = {
  school?: string;
  degree?: string;
  dates?: string;
  gpa?: string;
};

export type ResumeStructuredData = {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: {
    linkedin?: string;
    portfolio?: string;
    other?: string[];
  };
  summary?: string;
  skills?: string[];
  experiences?: ResumeExperience[];
  projects?: ResumeProject[];
  education?: ResumeEducation[];
  certifications?: string[];
  awards?: string[];
  volunteering?: string[];
};

// ATS-safe layout: single column, real text, standard font, no images,
// tables, or multi-column flow. Bullets use a "• " text prefix rather than
// list markup so the extracted text reads cleanly.
const styles = StyleSheet.create({
  page: {
    paddingTop: 54, // 0.75in = 54pt
    paddingBottom: 54,
    paddingHorizontal: 54,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.4,
    color: "#1a1a1a",
  },
  name: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 9.5,
    color: "#444444",
    marginBottom: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryText: {
    marginBottom: 2,
  },
  skillsText: {
    marginBottom: 2,
  },
  entry: {
    marginBottom: 8,
  },
  entryHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  entrySub: {
    fontSize: 10,
    color: "#444444",
    marginBottom: 2,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 1.5,
    paddingLeft: 4,
  },
  bulletPrefix: {
    width: 10,
  },
  bulletText: {
    flex: 1,
  },
  listItem: {
    marginBottom: 1.5,
    paddingLeft: 4,
  },
});

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletPrefix}>• </Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

type Props = {
  data: ResumeStructuredData;
};

export function ResumeDocument({ data }: Props) {
  const contactParts = [data.location, data.phone, data.email].filter(Boolean);
  const linkParts = [data.links?.linkedin, data.links?.portfolio, ...(data.links?.other ?? [])].filter(
    Boolean,
  );

  return (
    <Document
      title={`${data.fullName ?? "Resume"} — Resume`}
      author={data.fullName ?? "ResumeTailor"}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.name}>{data.fullName ?? "Your Name"}</Text>
        {contactParts.length > 0 && (
          <Text style={styles.contactLine}>{contactParts.join("  |  ")}</Text>
        )}
        {linkParts.length > 0 && (
          <Text style={styles.contactLine}>{linkParts.join("  |  ")}</Text>
        )}

        {/* Summary */}
        {data.summary ? (
          <View>
            <Text style={styles.sectionHeader}>Professional Summary</Text>
            <Text style={styles.summaryText}>{data.summary}</Text>
          </View>
        ) : null}

        {/* Skills */}
        {data.skills && data.skills.length > 0 ? (
          <View>
            <Text style={styles.sectionHeader}>Skills</Text>
            <Text style={styles.skillsText}>{data.skills.join(", ")}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {data.experiences && data.experiences.length > 0 ? (
          <View>
            <Text style={styles.sectionHeader}>Experience</Text>
            {data.experiences.map((exp, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <Text style={styles.entryHeader}>
                  {[exp.role, exp.company].filter(Boolean).join(" — ")}
                </Text>
                {exp.dates ? <Text style={styles.entrySub}>{exp.dates}</Text> : null}
                {(exp.bullets ?? []).map((b, j) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
                {(exp.metrics ?? []).map((m, j) => (
                  <Bullet key={`m-${j}`}>{`Impact: ${m}`}</Bullet>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Projects */}
        {data.projects && data.projects.length > 0 ? (
          <View>
            <Text style={styles.sectionHeader}>Projects</Text>
            {data.projects.map((p, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <Text style={styles.entryHeader}>{p.name ?? "Project"}</Text>
                {[p.stack, p.link].filter(Boolean).length > 0 ? (
                  <Text style={styles.entrySub}>
                    {[p.stack, p.link].filter(Boolean).join("  |  ")}
                  </Text>
                ) : null}
                {(p.bullets ?? []).map((b, j) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        {data.education && data.education.length > 0 ? (
          <View>
            <Text style={styles.sectionHeader}>Education</Text>
            {data.education.map((e, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <Text style={styles.entryHeader}>
                  {[e.school, e.degree].filter(Boolean).join(" — ")}
                </Text>
                <Text style={styles.entrySub}>
                  {[e.dates, e.gpa ? `GPA: ${e.gpa}` : null].filter(Boolean).join("  |  ")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 ? (
          <View>
            <Text style={styles.sectionHeader}>Certifications</Text>
            {data.certifications.map((c, i) => (
              <Bullet key={i}>{c}</Bullet>
            ))}
          </View>
        ) : null}

        {/* Awards */}
        {data.awards && data.awards.length > 0 ? (
          <View>
            <Text style={styles.sectionHeader}>Awards</Text>
            {data.awards.map((a, i) => (
              <Bullet key={i}>{a}</Bullet>
            ))}
          </View>
        ) : null}

        {/* Volunteering */}
        {data.volunteering && data.volunteering.length > 0 ? (
          <View>
            <Text style={styles.sectionHeader}>Leadership &amp; Volunteering</Text>
            {data.volunteering.map((v, i) => (
              <Bullet key={i}>{v}</Bullet>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
