import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { ResumePresentation } from '../../resume/presentation'

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

export function ModernAtsTemplate({
  presentation,
}: {
  presentation: ResumePresentation
}) {
  return (
    <Page size="LETTER" style={styles.page}>
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
                <Text style={styles.skills}>{section.items.join(' / ')}</Text>
              </Section>
            ) : null
          case 'work':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Experience">
                {section.items.map((item) => (
                  <View key={item.id} style={styles.entry}>
                    <View style={styles.row}>
                      <Text style={styles.entryHeader}>
                        {[item.role, item.organization]
                          .filter(Boolean)
                          .join(' at ') || 'Work Experience'}
                      </Text>
                      {item.meta ? (
                        <Text style={styles.meta}>{item.meta}</Text>
                      ) : null}
                    </View>
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
                    <View style={styles.row}>
                      <Text style={styles.entryHeader}>
                        {[item.credential, item.school]
                          .filter(Boolean)
                          .join(' at ') || 'Education'}
                      </Text>
                      {item.meta ? (
                        <Text style={styles.meta}>{item.meta}</Text>
                      ) : null}
                    </View>
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
