import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { ResumePresentation } from '../../resume/presentation'
import type { ResumePdfTypography } from '../fonts/resume-pdf-typography'
import { TemplateText } from './template-text'

const BODY_FONT_SIZE = 10
const NAME_FONT_SIZE = 20
const LINE_HEIGHT_RATIO = 1.35
const BODY_LINE_HEIGHT = BODY_FONT_SIZE * LINE_HEIGHT_RATIO
const NAME_LINE_HEIGHT = NAME_FONT_SIZE * LINE_HEIGHT_RATIO

const styles = StyleSheet.create({
  page: {
    paddingBottom: 42,
    paddingHorizontal: 48,
    paddingTop: 44,
    fontSize: BODY_FONT_SIZE,
    lineHeight: LINE_HEIGHT_RATIO,
    color: '#111111',
  },
  name: {
    fontSize: NAME_FONT_SIZE,
    fontWeight: 700,
  },
  contactContainer: {
    marginTop: 6,
  },
  linkLineContainer: {
    marginTop: 3,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    borderBottomColor: '#111111',
    borderBottomWidth: 1,
    fontWeight: 700,
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
    fontWeight: 700,
  },
  mutedContainer: {
    marginTop: 2,
  },
  mutedText: {
    color: '#333333',
  },
  bulletContainer: {
    marginLeft: 8,
    marginTop: 2,
  },
})

type TextLayout = ResumePdfTypography['textLayout']

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function BulletList({
  items,
  textLayout,
}: {
  items: readonly string[]
  textLayout: TextLayout
}) {
  return items.map((item, index) => (
    <TemplateText
      containerStyle={styles.bulletContainer}
      key={`${item}-${index}`}
      lineHeight={BODY_LINE_HEIGHT}
      prefix="- "
      text={item}
      textLayout={textLayout}
    />
  ))
}

export function ClassicAtsTemplate({
  presentation,
  typography,
}: {
  presentation: ResumePresentation
  typography: ResumePdfTypography
}) {
  const { textLayout } = typography

  return (
    <Page
      size="LETTER"
      style={[styles.page, { fontFamily: typography.fontFamily }]}
    >
      <TemplateText
        align="center"
        lineHeight={NAME_LINE_HEIGHT}
        text={presentation.header.name || 'Untitled Resume'}
        textLayout={textLayout}
        textStyle={styles.name}
      />
      {presentation.header.contact ? (
        <TemplateText
          align="center"
          containerStyle={styles.contactContainer}
          lineHeight={BODY_LINE_HEIGHT}
          text={presentation.header.contact}
          textLayout={textLayout}
        />
      ) : null}
      {presentation.header.links.length > 0 ? (
        <TemplateText
          align="center"
          containerStyle={styles.linkLineContainer}
          lineHeight={BODY_LINE_HEIGHT}
          text={presentation.header.links.join(' | ')}
          textLayout={textLayout}
        />
      ) : null}

      {presentation.sections.map((section) => {
        switch (section.kind) {
          case 'skills':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Skills">
                <TemplateText
                  lineHeight={BODY_LINE_HEIGHT}
                  text={section.items.join(' | ')}
                  textLayout={textLayout}
                />
              </Section>
            ) : null
          case 'work':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Experience">
                {section.items.map((item) => (
                  <View key={item.id} style={styles.entry}>
                    <TemplateText
                      lineHeight={BODY_LINE_HEIGHT}
                      text={
                        [item.role, item.organization]
                          .filter(Boolean)
                          .join(', ') || 'Work Experience'
                      }
                      textLayout={textLayout}
                      textStyle={styles.entryHeader}
                    />
                    {item.meta ? (
                      <TemplateText
                        containerStyle={styles.mutedContainer}
                        lineHeight={BODY_LINE_HEIGHT}
                        text={item.meta}
                        textLayout={textLayout}
                        textStyle={styles.mutedText}
                      />
                    ) : null}
                    <BulletList
                      items={item.highlights}
                      textLayout={textLayout}
                    />
                  </View>
                ))}
              </Section>
            ) : null
          case 'education':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Education">
                {section.items.map((item) => (
                  <View key={item.id} style={styles.entry}>
                    <TemplateText
                      lineHeight={BODY_LINE_HEIGHT}
                      text={
                        [item.credential, item.school]
                          .filter(Boolean)
                          .join(', ') || 'Education'
                      }
                      textLayout={textLayout}
                      textStyle={styles.entryHeader}
                    />
                    {item.meta ? (
                      <TemplateText
                        containerStyle={styles.mutedContainer}
                        lineHeight={BODY_LINE_HEIGHT}
                        text={item.meta}
                        textLayout={textLayout}
                        textStyle={styles.mutedText}
                      />
                    ) : null}
                    <BulletList items={item.details} textLayout={textLayout} />
                  </View>
                ))}
              </Section>
            ) : null
          case 'projects':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Projects">
                {section.items.map((item) => (
                  <View key={item.id} style={styles.entry}>
                    <TemplateText
                      lineHeight={BODY_LINE_HEIGHT}
                      text={item.name || 'Project'}
                      textLayout={textLayout}
                      textStyle={styles.entryHeader}
                    />
                    {item.description ? (
                      <TemplateText
                        containerStyle={styles.mutedContainer}
                        lineHeight={BODY_LINE_HEIGHT}
                        text={item.description}
                        textLayout={textLayout}
                        textStyle={styles.mutedText}
                      />
                    ) : null}
                    <BulletList
                      items={item.highlights}
                      textLayout={textLayout}
                    />
                  </View>
                ))}
              </Section>
            ) : null
        }
      })}
    </Page>
  )
}
