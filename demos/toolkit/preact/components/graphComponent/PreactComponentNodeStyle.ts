/****************************************************************************
 ** @license
 ** This demo file is part of yFiles for HTML 2.4.
 ** Copyright (c) 2000-2022 by yWorks GmbH, Vor dem Kreuzberg 28,
 ** 72070 Tuebingen, Germany. All rights reserved.
 **
 ** yFiles demo files exhibit yFiles for HTML functionalities. Any redistribution
 ** of demo files in source code or binary form, with or without
 ** modification, is not permitted.
 **
 ** Owners of a valid software license for a yFiles for HTML version that this
 ** demo is shipped with are allowed to use the demo source code as basis
 ** for their own yFiles for HTML powered applications. Use of such programs is
 ** governed by the rights and conditions as set out in the yFiles for HTML
 ** license agreement.
 **
 ** THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESS OR IMPLIED
 ** WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 ** MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
 ** NO EVENT SHALL yWorks BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 ** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 ** TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 ** PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 ** LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 ** NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 ** SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **
 ***************************************************************************/
// @ts-ignore
import { h, render } from '../../preact-loader'
// @ts-ignore
import type { ComponentType } from '../../preact-loader'
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INode, IRenderContext } from 'yfiles'
import { NodeStyleBase, SvgVisual, Visual } from 'yfiles'

/**
 * The interface of the props passed to the SVG Preact component for rendering the node contents.
 */
export interface PreactComponentNodeStyleProps<TTag = any> {
  width: number
  height: number
  tag: TTag
}

function dispose(context: IRenderContext, removedVisual: Visual, dispose: boolean): Visual | null {
  const gElement = (removedVisual as SvgVisual).svgElement as SVGGElement
  // see https://github.com/preactjs/preact/issues/53#issuecomment-522328979
  render(null, gElement)
  return null
}

type RenderType<TTag> = ComponentType<PreactComponentNodeStyleProps<TTag>>

declare type Cache<TTag> = { cache: PreactComponentNodeStyleProps<TTag> }

/**
 * A simple INodeStyle implementation that uses Preact Components/render functions
 * for rendering the node visualizations
 * Use it like this:
 * <code>
 *  declare type TagType = { name: string }
 *
 *  const MyNodeTemplate = ({ width, height, tag }: PreactComponentNodeStyleProps<TagType>) => (
 *    <g>
 *      <rect width={width} height={height} fill="blue" />
 *      <text y="10">{tag.name}</text>
 *   </g>
 *  )
 *
 *  const style = new PreactComponentNodeStyle(NodeTemplate)
 *
 *  const tag: TagType = { name: 'yFiles' }
 *  graph.createNode({ style, tag })
 * </code>
 */
export default class PreactComponentNodeStyle<TTag> extends NodeStyleBase {
  constructor(private readonly type: RenderType<TTag>) {
    super()
  }

  createProps(node: INode): PreactComponentNodeStyleProps<TTag> {
    return {
      width: node.layout.width,
      height: node.layout.height,
      tag: node.tag as TTag
    }
  }

  createVisual(context: IRenderContext, node: INode): Visual | null {
    const gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const props = this.createProps(node)
    const element = h(this.type, props)
    render(element, gElement)
    SvgVisual.setTranslate(gElement, node.layout.x, node.layout.y)
    const svgVisual = new SvgVisual(gElement) as SvgVisual & Cache<TTag>
    svgVisual.cache = props

    context.setDisposeCallback(svgVisual, dispose)
    return svgVisual
  }

  updateVisual(context: IRenderContext, oldVisual: Visual, node: INode): Visual | null {
    const oldSvgVisual = oldVisual as SvgVisual & Cache<TTag>
    const gElement = oldSvgVisual.svgElement as SVGGElement

    const props = this.createProps(node)

    const lastProps = oldSvgVisual.cache
    if (
      lastProps.width !== props.width ||
      lastProps.height !== props.height ||
      lastProps.tag !== props.tag
    ) {
      const element = h(this.type, props)
      render(element, gElement)
      oldSvgVisual.cache = props
    }
    SvgVisual.setTranslate(gElement, node.layout.x, node.layout.y)
    return oldVisual
  }
}
