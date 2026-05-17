import { StyleSheet } from '@react-pdf/renderer'

export const PAGE_SIZE = 'A4' as const

export const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.45,
    color: '#111111',
  },
  headerBlock: {
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 0.75,
    borderBottomColor: '#999999',
    borderBottomStyle: 'solid',
  },
  pageTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  pageSubtitle: {
    fontSize: 10,
    color: '#555555',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 8,
  },
  monoBlock: {
    fontFamily: 'Courier',
    fontSize: 9.5,
    backgroundColor: '#f4f4f4',
    padding: 8,
    marginVertical: 6,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metaLabel: {
    width: 110,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#444444',
  },
  metaValue: {
    fontSize: 10,
    color: '#111111',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 56,
    right: 56,
    fontSize: 8,
    color: '#888888',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
  clauseHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginTop: 10,
    marginBottom: 4,
  },
  clauseHighlight: {
    backgroundColor: '#fffbe6',
    padding: 6,
    marginBottom: 6,
  },
  messageBlock: {
    marginBottom: 10,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#888888',
    borderLeftStyle: 'solid',
  },
  messageMeta: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 3,
  },
  placeholder: {
    fontStyle: 'italic',
    color: '#666666',
    marginVertical: 12,
  },
})
