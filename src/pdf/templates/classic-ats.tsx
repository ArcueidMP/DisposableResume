import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { ResumePresentation } from '../../resume/presentation'

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

export function ClassicAtsTemplate({
  presentation,
}: {
  presentation: ResumePresentation
}) {
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.name}>
        {presentation.header.name || 'Untitled Resume'}
      </Text>
      {presentation.header.contact ? (
        <Text style={styles.contact}>{presentation.header.contact}</Text>
      ) : null}
      {presentation.header.links.length > 0 ? (
        <Text style={styles.linkLine}>
          {presentation.header.links.join(' | ')}
        </Text>
      ) : null}

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
                      {[item.role, item.organization]
                        .filter(Boolean)
                        .join(', ') || 'Work Experience'}
                    </Text>
                    {item.meta ? (
                      <Text style={styles.muted}>{item.meta}</Text>
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
                      {[item.credential, item.school]
                        .filter(Boolean)
                        .join(', ') || 'Education'}
                    </Text>
                    {item.meta ? (
                      <Text style={styles.muted}>{item.meta}</Text>
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
                      <Text style={styles.muted}>{item.description}</Text>
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
