import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { ResumePresentation } from '../../resume/presentation'

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

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function BulletList({ items }: { items: readonly string[] }) {
  return items.map((item, index) => (
    <Text key={`${item}-${index}`} style={styles.bullet}>
      - {item}
    </Text>
  ))
}

export function ChineseCleanTemplate({
  presentation,
}: {
  presentation: ResumePresentation
}) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>
          {presentation.header.name || 'Untitled Resume'}
        </Text>
        {presentation.header.contact ? (
          <Text style={styles.contact}>{presentation.header.contact}</Text>
        ) : null}
        {presentation.header.links.length > 0 ? (
          <Text style={styles.contact}>
            {presentation.header.links.join(' | ')}
          </Text>
        ) : null}
      </View>

      {presentation.sections.map((section) => {
        switch (section.kind) {
          case 'skills':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Skills">
                <Text>{section.items.join(' | ')}</Text>
              </Section>
            ) : null
          case 'work':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Experience">
                {section.items.map((item) => (
                  <View key={item.id} style={styles.entry}>
                    <Text style={styles.entryHeader}>
                      {[item.organization, item.role]
                        .filter(Boolean)
                        .join(' - ') || 'Work Experience'}
                    </Text>
                    {item.meta ? (
                      <Text style={styles.meta}>{item.meta}</Text>
                    ) : null}
                    <BulletList items={item.highlights} />
                  </View>
                ))}
              </Section>
            ) : null
          case 'education':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Education">
                {section.items.map((item) => (
                  <View key={item.id} style={styles.entry}>
                    <Text style={styles.entryHeader}>
                      {[item.school, item.credential]
                        .filter(Boolean)
                        .join(' - ') || 'Education'}
                    </Text>
                    {item.meta ? (
                      <Text style={styles.meta}>{item.meta}</Text>
                    ) : null}
                    <BulletList items={item.details} />
                  </View>
                ))}
              </Section>
            ) : null
          case 'projects':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Projects">
                {section.items.map((item) => (
                  <View key={item.id} style={styles.entry}>
                    <Text style={styles.entryHeader}>
                      {item.name || 'Project'}
                    </Text>
                    {item.description ? (
                      <Text style={styles.description}>{item.description}</Text>
                    ) : null}
                    <BulletList items={item.highlights} />
                  </View>
                ))}
              </Section>
            ) : null
        }
      })}
    </Page>
  )
}
