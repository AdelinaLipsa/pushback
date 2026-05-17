import { describe, it, expect } from 'vitest'
import type { ReactElement } from 'react'
import { PackDocument } from '@/lib/dispute/renderPack'
import { fixture as nad } from './fixtures/not_as_described'
import { fixture as nrec } from './fixtures/not_received'
import { fixture as can } from './fixtures/cancelled'
import { fixture as una } from './fixtures/unauthorized'

type JsonNode =
  | string
  | number
  | null
  | JsonNode[]
  | { type: string; props: Record<string, unknown>; children: JsonNode }

function isReactElement(node: unknown): node is ReactElement {
  return (
    typeof node === 'object' &&
    node !== null &&
    '$$typeof' in node &&
    'type' in node &&
    'props' in node
  )
}

function treeToJson(node: unknown): JsonNode {
  if (node === null || node === undefined || node === false || node === true) return null
  if (typeof node === 'string' || typeof node === 'number') return node
  if (Array.isArray(node)) {
    return node.map(treeToJson).filter(n => n !== null) as JsonNode[]
  }
  if (isReactElement(node)) {
    const elType = node.type
    const typeName =
      typeof elType === 'string'
        ? elType
        : ((elType as { displayName?: string; name?: string }).displayName ??
            (elType as { displayName?: string; name?: string }).name ??
            'Unknown')
    const allProps = (node.props ?? {}) as Record<string, unknown>
    const { children, ...rest } = allProps
    const serializableProps = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => typeof v !== 'function'),
    )
    return {
      type: typeName,
      props: serializableProps,
      children: treeToJson(children),
    }
  }
  return null
}

describe('PackDocument golden snapshots', () => {
  it('renders not_as_described pack', () => {
    expect(treeToJson(<PackDocument data={nad} />)).toMatchSnapshot()
  })

  it('renders not_received pack', () => {
    expect(treeToJson(<PackDocument data={nrec} />)).toMatchSnapshot()
  })

  it('renders cancelled pack', () => {
    expect(treeToJson(<PackDocument data={can} />)).toMatchSnapshot()
  })

  it('renders unauthorized pack', () => {
    expect(treeToJson(<PackDocument data={una} />)).toMatchSnapshot()
  })
})
