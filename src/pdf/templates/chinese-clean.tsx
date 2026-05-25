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
    paddingBottom: 38,
    paddingHorizontal: 42,
    paddingTop: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.42,
    color: '#1a1d1a',
  },
  header: {
    borderBottomColor: '#c9d4c7',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  name: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 21,
  },
  contact: {
    color: '#4e5b4d',
    marginTop: 5,
  },
  section: {
    marginTop: 13,
  },
  sectionTitle: {
    color: '#263a2b',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 6,
    paddingBottom: 3,
  },
  entry: {
    marginBottom: 8,
  },
  entryHeader: {
    fontFamily: 'Helvetica-Bold',
  },
  meta: {
    color: '#536052',
    marginTop: 2,
  },
  description: {
    marginTop: 3,
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

export function ChineseCleanTemplate({ resume }: { resume: Resume }) {
  const contact = formatContactLine(resume.basics)
  const links = resume.basics.links
    .map((link) => compactText([link.label, link.url]).join(': '))
    .filter(Boolean)
  const work = resume.work.filter(hasWorkContent)
  const education = resume.education.filter(hasEducationContent)
  const projects = resume.projects.filter(hasProjectContent)
  const skills = compactText(resume.skills)

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>
          {resume.basics.name.trim() || 'Untitled Resume'}
        </Text>
        {contact ? <Text style={styles.contact}>{contact}</Text> : null}
        {links.length > 0 ? (
          <Text style={styles.contact}>{links.join(' | ')}</Text>
        ) : null}
      </View>

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
                {compactText([item.organization, item.role]).join(' - ') ||
                  'Work Experience'}
              </Text>
              {formatDateLocationLine(item) ? (
                <Text style={styles.meta}>{formatDateLocationLine(item)}</Text>
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
                {compactText([item.school, item.credential]).join(' - ') ||
                  'Education'}
              </Text>
              {formatDateLocationLine(item) ? (
                <Text style={styles.meta}>{formatDateLocationLine(item)}</Text>
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
                <Text style={styles.description}>{item.description}</Text>
              ) : null}
              <BulletList items={item.highlights} />
            </View>
          ))}
        </Section>
      ) : null}
    </Page>
  )
}
