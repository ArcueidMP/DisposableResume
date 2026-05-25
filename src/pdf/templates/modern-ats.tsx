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
    paddingBottom: 40,
    paddingHorizontal: 46,
    paddingTop: 42,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#172017',
  },
  header: {
    borderBottomColor: '#6f856c',
    borderBottomWidth: 2,
    paddingBottom: 12,
  },
  name: {
    color: '#1f3b29',
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
  },
  contact: {
    color: '#435043',
    marginTop: 6,
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    color: '#1f3b29',
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  entry: {
    borderLeftColor: '#d6ded2',
    borderLeftWidth: 2,
    marginBottom: 9,
    paddingLeft: 9,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryHeader: {
    fontFamily: 'Helvetica-Bold',
    maxWidth: '70%',
  },
  meta: {
    color: '#586457',
    fontSize: 9,
    maxWidth: '30%',
    textAlign: 'right',
  },
  description: {
    color: '#364236',
    marginTop: 3,
  },
  bullet: {
    marginLeft: 8,
    marginTop: 2,
  },
  skills: {
    color: '#364236',
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

export function ModernAtsTemplate({ resume }: { resume: Resume }) {
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
          <Text style={styles.skills}>{skills.join(' / ')}</Text>
        </Section>
      ) : null}

      {work.length > 0 ? (
        <Section title="Experience">
          {work.map((item) => {
            const meta = formatDateLocationLine(item)

            return (
              <View key={item.id} style={styles.entry}>
                <View style={styles.row}>
                  <Text style={styles.entryHeader}>
                    {compactText([item.role, item.organization]).join(' at ') ||
                      'Work Experience'}
                  </Text>
                  {meta ? <Text style={styles.meta}>{meta}</Text> : null}
                </View>
                <BulletList items={item.highlights} />
              </View>
            )
          })}
        </Section>
      ) : null}

      {education.length > 0 ? (
        <Section title="Education">
          {education.map((item) => {
            const meta = formatDateLocationLine(item)

            return (
              <View key={item.id} style={styles.entry}>
                <View style={styles.row}>
                  <Text style={styles.entryHeader}>
                    {compactText([item.credential, item.school]).join(' at ') ||
                      'Education'}
                  </Text>
                  {meta ? <Text style={styles.meta}>{meta}</Text> : null}
                </View>
                <BulletList items={item.details} />
              </View>
            )
          })}
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
