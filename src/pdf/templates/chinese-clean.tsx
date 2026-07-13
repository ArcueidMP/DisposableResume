import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { ResumePresentation } from '../../resume/presentation'
import { CHINESE_CLEAN_FONT_FAMILY } from '../fonts/chinese-clean-font-family'
import { CjkWrapText } from './cjk-wrap-text'

const BODY_FONT_SIZE = 10
const LINE_HEIGHT_RATIO = 1.42
const NAME_FONT_SIZE = 21
const BODY_LINE_HEIGHT = BODY_FONT_SIZE * LINE_HEIGHT_RATIO
const NAME_LINE_HEIGHT = NAME_FONT_SIZE * LINE_HEIGHT_RATIO

const styles = StyleSheet.create({
  page: {
    paddingBottom: 38,
    paddingHorizontal: 42,
    paddingTop: 40,
    fontFamily: CHINESE_CLEAN_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: LINE_HEIGHT_RATIO,
    color: '#1a1d1a',
  },
  header: {
    borderBottomColor: '#c9d4c7',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  name: {
    fontWeight: 700,
    fontSize: NAME_FONT_SIZE,
  },
  contactContainer: {
    marginTop: 5,
  },
  contactText: {
    color: '#4e5b4d',
  },
  section: {
    marginTop: 13,
  },
  sectionTitle: {
    color: '#263a2b',
    fontWeight: 700,
    fontSize: 10,
    marginBottom: 6,
    paddingBottom: 3,
  },
  entry: {
    marginBottom: 8,
  },
  entryHeader: {
    fontWeight: 700,
  },
  metaContainer: {
    marginTop: 2,
  },
  metaText: {
    color: '#536052',
  },
  descriptionContainer: {
    marginTop: 3,
  },
  bulletContainer: {
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
    <CjkWrapText
      containerStyle={styles.bulletContainer}
      key={`${item}-${index}`}
      lineHeight={BODY_LINE_HEIGHT}
      prefix="- "
      text={item}
    />
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
        <CjkWrapText
          lineHeight={NAME_LINE_HEIGHT}
          text={presentation.header.name || 'Untitled Resume'}
          textStyle={styles.name}
        />
        {presentation.header.contact ? (
          <CjkWrapText
            containerStyle={styles.contactContainer}
            lineHeight={BODY_LINE_HEIGHT}
            text={presentation.header.contact}
            textStyle={styles.contactText}
          />
        ) : null}
        {presentation.header.links.length > 0 ? (
          <CjkWrapText
            containerStyle={styles.contactContainer}
            lineHeight={BODY_LINE_HEIGHT}
            text={presentation.header.links.join(' | ')}
            textStyle={styles.contactText}
          />
        ) : null}
      </View>

      {presentation.sections.map((section) => {
        switch (section.kind) {
          case 'skills':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Skills">
                <CjkWrapText
                  lineHeight={BODY_LINE_HEIGHT}
                  text={section.items.join(' | ')}
                />
              </Section>
            ) : null
          case 'work':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Experience">
                {section.items.map((item) => (
                  <View key={item.id} style={styles.entry}>
                    <CjkWrapText
                      lineHeight={BODY_LINE_HEIGHT}
                      text={
                        [item.organization, item.role]
                          .filter(Boolean)
                          .join(' - ') || 'Work Experience'
                      }
                      textStyle={styles.entryHeader}
                    />
                    {item.meta ? (
                      <CjkWrapText
                        containerStyle={styles.metaContainer}
                        lineHeight={BODY_LINE_HEIGHT}
                        text={item.meta}
                        textStyle={styles.metaText}
                      />
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
                    <CjkWrapText
                      lineHeight={BODY_LINE_HEIGHT}
                      text={
                        [item.school, item.credential]
                          .filter(Boolean)
                          .join(' - ') || 'Education'
                      }
                      textStyle={styles.entryHeader}
                    />
                    {item.meta ? (
                      <CjkWrapText
                        containerStyle={styles.metaContainer}
                        lineHeight={BODY_LINE_HEIGHT}
                        text={item.meta}
                        textStyle={styles.metaText}
                      />
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
                    <CjkWrapText
                      lineHeight={BODY_LINE_HEIGHT}
                      text={item.name || 'Project'}
                      textStyle={styles.entryHeader}
                    />
                    {item.description ? (
                      <CjkWrapText
                        containerStyle={styles.descriptionContainer}
                        lineHeight={BODY_LINE_HEIGHT}
                        text={item.description}
                      />
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
