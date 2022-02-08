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
import {
  CanvasComponent,
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
import { SVGNS, XLINKNS } from './Namespaces.js'

const HORIZONTAL_INSET = 2
const VERTICAL_INSET = 2
const BUTTON_SIZE = 16

/**
 * This class is an example for a custom style based on the {@link LabelStyleBase}.
 * The font for the label text can be set. The label text is drawn with black letters inside a blue
 * rounded rectangle.
 * Also there is a customized button displayed in the label at certain zoom levels that enables
 * editing of the label text.
 */
export default class CustomSimpleLabelStyle extends LabelStyleBase {
  /**
   * Initializes a new instance of the {@link CustomSimpleLabelStyle} class using the "Arial" font.
   */
  constructor() {
    super()

    this.font = new Font({
      fontFamily: 'Arial',
      fontSize: 12
    })
  }

  /**
   * Creates the visual for a label to be drawn.
   * @see Overrides {@link LabelStyleBase#createVisual}
   * @param {!IRenderContext} context
   * @param {!ILabel} label
   * @returns {!SvgVisual}
   */
  createVisual(context, label) {
    // This implementation creates a 'g' element and uses it for the rendering of the label.
    const container = document.createElementNS(SVGNS, 'g')
    // Get the necessary data for rendering of the label
    const cache = CustomSimpleLabelStyle.createRenderDataCache(context, label, this.font)
    // Render the label
    this.render(container, label.layout, cache)
    // move container to correct location
    const transform = LabelStyleBase.createLayoutTransform(context, label.layout, true)
    transform.applyTo(container)

    // set data item
    container.setAttribute('data-internalId', 'CustomSimpleLabel')
    container['data-item'] = label

    return new SvgVisual(container)
  }

  /**
   * Re-renders the label using the old visual for performance reasons.
   * @see Overrides {@link LabelStyleBase#updateVisual}
   * @param {!IRenderContext} context
   * @param {!SvgVisual} oldVisual
   * @param {!ILabel} label
   * @returns {!SvgVisual}
   */
  updateVisual(context, oldVisual, label) {
    const container = oldVisual.svgElement
    // get the data with which the oldvisual was created
    const oldCache = container['data-renderDataCache']
    // get the data for the new visual
    const newCache = CustomSimpleLabelStyle.createRenderDataCache(context, label, this.font)
    if (!newCache.equals(oldCache)) {
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
   * Creates the visual appearance of a label.
   * @param {*} container
   * @param {!IOrientedRectangle} labelLayout
   * @param {!LabelRenderDataCache} cache
   */
  render(container, labelLayout, cache) {
    // store information with the visual on how we created it
    container['data-renderDataCache'] = cache

    // background rectangle
    let rect
    if (container.childElementCount > 0) {
      rect = container.childNodes[0]
    } else {
      rect = document.createElementNS(SVGNS, 'rect')
      rect.rx.baseVal.value = 5
      rect.ry.baseVal.value = 5
      container.appendChild(rect)
    }
    rect.width.baseVal.value = labelLayout.width
    rect.height.baseVal.value = labelLayout.height
    rect.setAttribute('stroke', 'skyblue')
    rect.setAttribute('stroke-width', '1')
    rect.setAttribute('fill', 'rgb(155,226,255)')

    let text
    if (container.childElementCount > 1) {
      text = container.childNodes[1]
    } else {
      text = document.createElementNS(SVGNS, 'text')
      text.setAttribute('fill', '#000')
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
      container.removeChild(container.lastChild)
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

      button.addEventListener('click', evt => onMouseDown(evt), false)
    }
  }

  /**
   * Creates an object containing all necessary data to create a label visual.
   * @param {!IRenderContext} context
   * @param {!ILabel} label
   * @param {!Font} font
   * @returns {!LabelRenderDataCache}
   */
  static createRenderDataCache(context, label, font) {
    // Visibility of button changes dependent on the zoom level
    return new LabelRenderDataCache(label.text, context.zoom > 1, font)
  }

  /**
   * Calculates the preferred size for the given label if this style is used for the rendering.
   * The size is calculated from the label's text.
   * @see Overrides {@link LabelStyleBase#getPreferredSize}
   * @param {!ILabel} label
   * @returns {!Size}
   */
  getPreferredSize(label) {
    // first measure
    const size = TextRenderSupport.measureText(label.text, this.font)
    // then use the desired size - plus rounding and insets, as well as space for button
    return new Size(
      Math.ceil(0.5 + size.width) + HORIZONTAL_INSET * 3 + BUTTON_SIZE,
      2 * VERTICAL_INSET + Math.max(BUTTON_SIZE, Math.ceil(0.5 + size.height))
    )
  }
}

class LabelRenderDataCache {
  /**
   * @param {!string} text
   * @param {boolean} buttonVisibility
   * @param {!Font} font
   */
  constructor(text, buttonVisibility, font) {
    this.font = font
    this.buttonVisibility = buttonVisibility
    this.text = text
  }

  /**
   * @param {!LabelRenderDataCache} [other]
   * @returns {boolean}
   */
  equals(other) {
    return (
      !!other &&
      this.text === other.text &&
      this.buttonVisibility === other.buttonVisibility &&
      this.font.equals(other.font)
    )
  }
}

/**
 * @returns {!SVGGElement}
 */
function createButton() {
  const image = document.createElementNS(SVGNS, 'image')
  image.setAttributeNS(XLINKNS, 'href', 'resources/edit_label.png')
  image.x.baseVal.value = 1
  image.y.baseVal.value = 1
  image.width.baseVal.value = BUTTON_SIZE - 2
  image.height.baseVal.value = BUTTON_SIZE - 2
  const button = document.createElementNS(SVGNS, 'rect')
  button.width.baseVal.value = BUTTON_SIZE
  button.height.baseVal.value = BUTTON_SIZE
  button.rx.baseVal.value = 3
  button.ry.baseVal.value = 3
  button.setAttribute('fill', '#000')
  button.setAttribute('fill-opacity', '0.07')
  button.setAttribute('stroke', '#000')
  button.setAttribute('stroke-width', '1')
  const g = document.createElementNS(SVGNS, 'g')
  g.appendChild(button)
  g.appendChild(image)
  return g
}

/**
 * Called when the edit label button inside a label has been clicked.
 * @param {!Event} evt
 */
function onMouseDown(evt) {
  const graphComponentElement = getAncestorElementByAttribute(evt.target, 'id', 'graphComponent')
  if (!graphComponentElement) {
    return
  }

  const svgElement = getAncestorElementByAttribute(
    evt.target,
    'data-internalId',
    'CustomSimpleLabel'
  )
  const label = getLabel(svgElement)
  if (!label) {
    return
  }

  const graphComponent = CanvasComponent.getComponent(graphComponentElement)
  if (graphComponent && graphComponent.inputMode instanceof GraphEditorInputMode) {
    graphComponent.inputMode.editLabel(label)
  }
}

/**
 * @param {!EventTarget} descendant
 * @param {!string} attributeName
 * @param {!string} attributeValue
 * @returns {?Element}
 */
function getAncestorElementByAttribute(descendant, attributeName, attributeValue) {
  if (descendant instanceof Element) {
    let walker = descendant
    while (walker && walker.getAttribute(attributeName) !== attributeValue) {
      walker = walker.parentNode instanceof Element ? walker.parentNode : null
    }
    return walker
  }
  return null
}

/**
 * @param {?*} element
 * @returns {?ILabel}
 */
function getLabel(element) {
  return element && typeof element['data-item'] !== 'undefined' ? element['data-item'] : null
}
