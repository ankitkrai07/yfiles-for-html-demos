/****************************************************************************
 ** @license
 ** This demo file is part of yFiles for HTML 2.5.
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CanvasComponent,
  Color,
  Font,
  GraphEditorInputMode,
  ILabel,
  IOrientedRectangle,
  IRenderContext,
  LabelStyleBase,
  Matrix,
  Size,
  SvgVisual,
  TextRenderSupport,
  TextWrapping
} from 'yfiles'

const HORIZONTAL_INSET = 2
const VERTICAL_INSET = 2
const BUTTON_SIZE = 16

/**
 * This class is an example for a custom style based on the {@link LabelStyleBase}.
 * The font for the label text can be set. The label text is drawn with black letters inside a blue rounded
 * rectangle.
 * Also there is a customized button displayed in the label at certain zoom levels that enables editing of the label
 * text.
 */
export class MySimpleLabelStyle extends LabelStyleBase {
  private $font: Font

  /**
   * Initializes a new instance of the {@link MySimpleLabelStyle} class using the "Arial" font.
   */
  constructor() {
    super()
    this.$font = new Font({
      fontFamily: 'Arial',
      fontSize: 12
    })
  }

  /**
   * Creates the visual appearance of a label.
   */
  render(container: SVGElement, labelLayout: IOrientedRectangle, cache: any): void {
    // store information with the visual on how we created it
    ;(container as any)['data-renderDataCache'] = cache

    // background rectangle
    let rect: SVGRectElement
    if (container.childElementCount > 0) {
      rect = container.childNodes.item(0) as SVGRectElement
    } else {
      rect = window.document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.rx.baseVal.value = 5
      rect.ry.baseVal.value = 5
      container.appendChild(rect)
    }
    rect.width.baseVal.value = labelLayout.width
    rect.height.baseVal.value = labelLayout.height
    rect.setAttribute('stroke', 'skyblue')
    rect.setAttribute('stroke-width', '1')

    // //////////////////////////////////////////////////
    // ////////////// New in this sample ////////////////
    // //////////////////////////////////////////////////

    const background = cache.background as Color
    rect.setAttribute('fill', `rgb(${background.r},${background.g},${background.b})`)
    rect.setAttribute('fill-opacity', `${background.a / 255}`)

    // //////////////////////////////////////////////////

    let text: SVGTextElement
    if (container.childElementCount > 1) {
      text = container.childNodes.item(1) as SVGTextElement
    } else {
      text = window.document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('fill', 'black')
      container.appendChild(text)
    }
    // SVG does not provide out-of-the box text wrapping.
    // The following line uses a convenience method that implements text wrapping
    // with ellipsis by splitting the text and inserting tspan elements as children
    // of the text element. It is not mandatory to use this method, since the same
    // things could be done manually.
    const textContent = TextRenderSupport.addText(
      text,
      cache.text,
      cache.font,
      labelLayout.toSize(),
      TextWrapping.NONE
    )

    // calculate the size of the text element
    const textSize = TextRenderSupport.measureText(textContent, cache.font)

    // if edit button is visible align left, otherwise center
    const translateX = cache.buttonVisibility
      ? HORIZONTAL_INSET
      : (labelLayout.width - textSize.width) * 0.5

    // calculate vertical offset for centered alignment
    const translateY = (labelLayout.height - textSize.height) * 0.5

    text.setAttribute('transform', `translate(${translateX} ${translateY})`)
    while (container.childElementCount > 2) {
      container.removeChild(container.childNodes.item(2))
    }
    if (cache.buttonVisibility) {
      const button = createButton()
      new Matrix(
        1,
        0,
        0,
        1,
        labelLayout.width - HORIZONTAL_INSET - BUTTON_SIZE,
        VERTICAL_INSET
      ).applyTo(button)
      container.appendChild(button)

      button.addEventListener('click', (evt: MouseEvent): void => onMouseDown(evt), false)
    }
  }

  /**
   * Gets the font used for rendering the label text.
   */
  get font(): Font {
    return this.$font
  }

  /**
   * Sets the font used for rendering the label text.
   */
  set font(value: Font) {
    this.$font = value
  }

  /**
   * Creates the visual for a label to be drawn.
   * @see Overrides {@link LabelStyleBase.createVisual}
   */
  createVisual(context: IRenderContext, label: ILabel): SvgVisual {
    // This implementation creates a 'g' element and uses it for the rendering of the label.
    const g = window.document.createElementNS('http://www.w3.org/2000/svg', 'g')
    // Get the necessary data for rendering of the label
    const cache = this.createRenderDataCache(context, label, this.font)
    // Render the label
    this.render(g, label.layout, cache)
    // move container to correct location
    const transform = LabelStyleBase.createLayoutTransform(context, label.layout, true)
    transform.applyTo(g)
    // set data item
    g.setAttribute('data-internalId', 'MySimpleLabel')
    ;(g as any)['data-item'] = label
    return new SvgVisual(g)
  }

  /**
   * Re-renders the label using the old visual for performance reasons.
   * @see Overrides {@link LabelStyleBase.updateVisual}
   */
  updateVisual(context: IRenderContext, oldVisual: SvgVisual, label: ILabel): SvgVisual {
    const container = oldVisual.svgElement
    // get the data with which the oldvisual was created
    const oldCache = (container as any)['data-renderDataCache']
    // get the data for the new visual
    const newCache = this.createRenderDataCache(context, label, this.font)
    if (!oldCache.equals(oldCache, newCache)) {
      // something changed - re-render the visual
      this.render(container, label.layout, newCache)
    }
    // nothing changed, return the old visual
    // arrange because the layout might have changed
    const transform = LabelStyleBase.createLayoutTransform(context, label.layout, true)
    transform.applyTo(container)
    return oldVisual
  }

  /**
   * Creates an object containing all necessary data to create a label visual.
   */
  createRenderDataCache(context: IRenderContext, label: ILabel, font: Font): object {
    // //////////////////////////////////////////////////
    // ////////////// New in this sample ////////////////
    // //////////////////////////////////////////////////

    // If Tag is set to a BusinessObject, use its color as the background color of the label
    const color =
      label.tag instanceof BusinessObject
        ? label.tag.color
        : new Color({
            a: 255,
            r: 240,
            g: 248,
            b: 255
          })

    // //////////////////////////////////////////////////

    // Visibility of button changes dependent on the zoom level
    const buttonVisibility = context.zoom > 1
    return {
      text: label.text,
      buttonVisibility,
      font,
      background: color,
      equals: (self: any, other: any): boolean =>
        self.text === other.text &&
        self.buttonVisibility === other.buttonVisibility &&
        self.font.equals(other.font) &&
        self.background.equals(other.background)
    }
  }

  /**
   * Calculates the preferred size for the given label if this style is used for the rendering.
   * The size is calculated from the label's text.
   * @see Overrides {@link LabelStyleBase.getPreferredSize}
   */
  getPreferredSize(label: ILabel): Size {
    // return size of the textblock plus some space for the button

    // first measure
    const size = TextRenderSupport.measureText(label.text, this.font)
    // then use the desired size - plus rounding and insets, as well as space for button
    return new Size(
      Math.ceil(0.5 + size.width) + HORIZONTAL_INSET * 3 + BUTTON_SIZE,
      2 * VERTICAL_INSET + Math.max(BUTTON_SIZE, Math.ceil(0.5 + size.height))
    )
  }
}

// //////////////////////////////////////////////////
// ////////////// New in this sample ////////////////
// //////////////////////////////////////////////////

/**
 * Some example business object which has just one property.
 */
export class BusinessObject {
  private $color: Color

  constructor(color: Color) {
    this.$color = color
  }

  get color(): Color {
    return this.$color
  }
}

// //////////////////////////////////////////////////

function createButton(): SVGGElement {
  const image = window.document.createElementNS('http://www.w3.org/2000/svg', 'image')
  image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'resources/edit_label.png')
  image.x.baseVal.value = 1
  image.y.baseVal.value = 1
  image.width.baseVal.value = BUTTON_SIZE - 2
  image.height.baseVal.value = BUTTON_SIZE - 2
  const button = window.document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  button.width.baseVal.value = BUTTON_SIZE
  button.height.baseVal.value = BUTTON_SIZE
  button.rx.baseVal.value = 3
  button.ry.baseVal.value = 3
  button.setAttribute('fill', 'black')
  button.setAttribute('fill-opacity', '0.07')
  button.setAttribute('stroke', 'black')
  button.setAttribute('stroke-width', '1')
  const g = window.document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.appendChild(button)
  g.appendChild(image)
  return g
}

/**
 * Called when the edit label button inside a label has been clicked.
 */
function onMouseDown(evt: MouseEvent): void {
  const graphComponentElement = getAncestorElementByAttribute(
    evt.target as Element,
    'id',
    'graphComponent'
  )
  if (!graphComponentElement) {
    return
  }
  const graphComponent = CanvasComponent.getComponent(graphComponentElement)
  const svgElement = getAncestorElementByAttribute(
    evt.target as Element,
    'data-internalId',
    'MySimpleLabel'
  )
  const svgDataItem = (svgElement as any)['data-item']
  const label = svgElement !== null && ILabel.isInstance(svgDataItem) ? svgDataItem : null
  if (
    graphComponent !== null &&
    label !== null &&
    graphComponent.inputMode instanceof GraphEditorInputMode
  ) {
    graphComponent.inputMode.editLabel(label)
  }
}

function getAncestorElementByAttribute(
  descendant: Element,
  attributeName: string,
  attributeValue: string
): Element | null {
  let walker: Element | null = descendant
  while (walker !== null && walker.getAttribute(attributeName) !== attributeValue) {
    walker = walker.parentNode instanceof Element ? walker.parentNode : null
  }
  return walker
}
