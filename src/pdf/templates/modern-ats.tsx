import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { ResumePresentation } from '../../resume/presentation'
import type { ResumePdfTypography } from '../fonts/resume-pdf-typography'
import { TemplateText } from './template-text'

const BODY_FONT_SIZE = 10
const META_FONT_SIZE = 9
const NAME_FONT_SIZE = 22
const LINE_HEIGHT_RATIO = 1.4
const BODY_LINE_HEIGHT = BODY_FONT_SIZE * LINE_HEIGHT_RATIO
const META_LINE_HEIGHT = META_FONT_SIZE * LINE_HEIGHT_RATIO
const NAME_LINE_HEIGHT = NAME_FONT_SIZE * LINE_HEIGHT_RATIO

const styles = StyleSheet.create({
  page: {
    paddingBottom: 40,
    paddingHorizontal: 46,
    paddingTop: 42,
    fontSize: BODY_FONT_SIZE,
    lineHeight: LINE_HEIGHT_RATIO,
    color: '#172017',
  },
  header: {
    borderBottomColor: '#6f856c',
    borderBottomWidth: 2,
    paddingBottom: 12,
  },
  name: {
    color: '#1f3b29',
    fontWeight: 700,
    fontSize: NAME_FONT_SIZE,
  },
  contactContainer: {
    marginTop: 6,
  },
  contactText: {
    color: '#435043',
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    color: '#1f3b29',
    fontWeight: 700,
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
  entryHeaderContainer: {
    maxWidth: '70%',
  },
  entryHeaderText: {
    fontWeight: 700,
  },
  metaContainer: {
    maxWidth: '30%',
  },
  metaText: {
    color: '#586457',
    fontSize: META_FONT_SIZE,
  },
  descriptionContainer: {
    marginTop: 3,
  },
  descriptionText: {
    color: '#364236',
  },
  bulletContainer: {
    marginLeft: 8,
    marginTop: 2,
  },
  skillsText: {
    color: '#364236',
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

function EntryRow({
  meta,
  textLayout,
  title,
}: {
  meta: string
  textLayout: TextLayout
  title: string
}) {
  return (
    <View style={styles.row}>
      <TemplateText
        containerStyle={styles.entryHeaderContainer}
        lineHeight={BODY_LINE_HEIGHT}
        text={title}
        textLayout={textLayout}
        textStyle={styles.entryHeaderText}
      />
      {meta ? (
        <TemplateText
          align="right"
          containerStyle={styles.metaContainer}
          lineHeight={META_LINE_HEIGHT}
          text={meta}
          textLayout={textLayout}
          textStyle={styles.metaText}
        />
      ) : null}
    </View>
  )
}

export function ModernAtsTemplate({
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
      <View style={styles.header}>
        <TemplateText
          lineHeight={NAME_LINE_HEIGHT}
          text={presentation.header.name || 'Untitled Resume'}
          textLayout={textLayout}
          textStyle={styles.name}
        />
        {presentation.header.contact ? (
          <TemplateText
            containerStyle={styles.contactContainer}
            lineHeight={BODY_LINE_HEIGHT}
            text={presentation.header.contact}
            textLayout={textLayout}
            textStyle={styles.contactText}
          />
        ) : null}
        {presentation.header.links.length > 0 ? (
          <TemplateText
            containerStyle={styles.contactContainer}
            lineHeight={BODY_LINE_HEIGHT}
            text={presentation.header.links.join(' | ')}
            textLayout={textLayout}
            textStyle={styles.contactText}
          />
        ) : null}
      </View>

      {presentation.sections.map((section) => {
        switch (section.kind) {
          case 'skills':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Skills">
                <TemplateText
                  lineHeight={BODY_LINE_HEIGHT}
                  text={section.items.join(' / ')}
                  textLayout={textLayout}
                  textStyle={styles.skillsText}
                />
              </Section>
            ) : null
          case 'work':
            return section.items.length > 0 ? (
              <Section key={section.kind} title="Experience">
                {section.items.map((item) => (
                  <View key={item.id} style={styles.entry}>
                    <EntryRow
                      meta={item.meta}
                      textLayout={textLayout}
                      title={
                        [item.role, item.organization]
                          .filter(Boolean)
                          .join(' at ') || 'Work Experience'
                      }
                    />
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
                    <EntryRow
                      meta={item.meta}
                      textLayout={textLayout}
                      title={
                        [item.credential, item.school]
                          .filter(Boolean)
                          .join(' at ') || 'Education'
                      }
                    />
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
                      textStyle={styles.entryHeaderText}
                    />
                    {item.description ? (
                      <TemplateText
                        containerStyle={styles.descriptionContainer}
                        lineHeight={BODY_LINE_HEIGHT}
                        text={item.description}
                        textLayout={textLayout}
                        textStyle={styles.descriptionText}
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
