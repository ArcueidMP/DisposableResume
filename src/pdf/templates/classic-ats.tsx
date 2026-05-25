import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { Resume } from '../../resume/types'
import {
  compactText,
  formatContactLine,
  formatDateLocationLine,
  hasEducationContent,
  hasProjectContent,
  hasWorkContent,
} from './shared'

const styles = StyleSheet.create({
  page: {
    paddingBottom: 42,
    paddingHorizontal: 48,
    paddingTop: 44,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.35,
    color: '#111111',
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  contact: {
    marginTop: 6,
    textAlign: 'center',
  },
  linkLine: {
    marginTop: 3,
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    borderBottomColor: '#111111',
    borderBottomWidth: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    letterSpacing: 0.4,
    marginBottom: 7,
    paddingBottom: 2,
    textTransform: 'uppercase',
  },
  entry: {
    marginBottom: 8,
  },
  entryHeader: {
    fontFamily: 'Helvetica-Bold',
  },
  muted: {
    color: '#333333',
    marginTop: 2,
  },
  bullet: {
    marginLeft: 8,
    marginTop: 2,
  },
})

function Section({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function BulletList({ items }: { items: string[] }) {
  return compactText(items).map((item, index) => (
    <Text key={`${item}-${index}`} style={styles.bullet}>
      - {item}
    </Text>
  ))
}

export function ClassicAtsTemplate({ resume }: { resume: Resume }) {
  const contact = formatContactLine(resume.basics)
  const links = resume.basics.links
    .map((link) => compactText([link.label, link.url]).join(': '))
    .filter(Boolean)
  const work = resume.work.filter(hasWorkContent)
  const education = resume.education.filter(hasEducationContent)
  const projects = resume.projects.filter(hasProjectContent)
  const skills = compactText(resume.skills)

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.name}>
        {resume.basics.name.trim() || 'Untitled Resume'}
      </Text>
      {contact ? <Text style={styles.contact}>{contact}</Text> : null}
      {links.length > 0 ? (
        <Text style={styles.linkLine}>{links.join(' | ')}</Text>
      ) : null}

      {skills.length > 0 ? (
        <Section title="Skills">
          <Text>{skills.join(' | ')}</Text>
        </Section>
      ) : null}

      {work.length > 0 ? (
        <Section title="Experience">
          {work.map((item) => (
            <View key={item.id} style={styles.entry}>
              <Text style={styles.entryHeader}>
                {compactText([item.role, item.organization]).join(', ') ||
                  'Work Experience'}
              </Text>
              {formatDateLocationLine(item) ? (
                <Text style={styles.muted}>{formatDateLocationLine(item)}</Text>
              ) : null}
              <BulletList items={item.highlights} />
            </View>
          ))}
        </Section>
      ) : null}

      {education.length > 0 ? (
        <Section title="Education">
          {education.map((item) => (
            <View key={item.id} style={styles.entry}>
              <Text style={styles.entryHeader}>
                {compactText([item.credential, item.school]).join(', ') ||
                  'Education'}
              </Text>
              {formatDateLocationLine(item) ? (
                <Text style={styles.muted}>{formatDateLocationLine(item)}</Text>
              ) : null}
              <BulletList items={item.details} />
            </View>
          ))}
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section title="Projects">
          {projects.map((item) => (
            <View key={item.id} style={styles.entry}>
              <Text style={styles.entryHeader}>
                {item.name.trim() || 'Project'}
              </Text>
              {item.description.trim() ? (
                <Text style={styles.muted}>{item.description}</Text>
              ) : null}
              <BulletList items={item.highlights} />
            </View>
          ))}
        </Section>
      ) : null}
    </Page>
  )
}
