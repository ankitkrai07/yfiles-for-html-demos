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
import {
  GeneralPath,
  GeomUtilities,
  IInputModeContext,
  INode,
  IRenderContext,
  NodeStyleBase,
  Point,
  SvgVisual,
  Visual
} from 'yfiles'
import Device, { DeviceKind } from './Device'

/**
 * A node style that visualizes the devices of a network.
 * It renders the icon according to the device kind and adds the 'failed' icon if necessary.
 */
export default class DeviceStyle extends NodeStyleBase {
  /**
   * Creates a new instance of NetworkMonitoringNodeStyle.
   * @param passiveSupported Whether or not the browser supports active and passive event listeners.
   */
  constructor(private readonly passiveSupported: boolean) {
    super()
  }

  /**
   * @see Overrides {@link NodeStyleBase.createVisual}
   */
  createVisual(context: IRenderContext, node: INode): SvgVisual {
    const container = window.document.createElementNS('http://www.w3.org/2000/svg', 'g')

    // create the image that represents the node type
    const image = window.document.createElementNS('http://www.w3.org/2000/svg', 'image')
    container.appendChild(image)
    const device = node.tag as Device

    const dxImage = node.layout.width * 0.2
    const dyImage = node.layout.height * 0.2
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', getImage(device))
    image.setAttribute('width', (node.layout.width * 0.6).toString())
    image.setAttribute('height', (node.layout.height * 0.6).toString())
    image.setAttribute('transform', `translate(${dxImage} ${dyImage})`)

    // visualize enabled and failed status
    const isDeviceWorking = device.enabled && !device.failed
    if (isDeviceWorking) {
      image.setAttribute('class', 'enabled')
    } else {
      container.style.setProperty('cursor', 'pointer')
      image.setAttribute('class', 'disabled')
    }

    // add the ellipse indicating the current load
    addLoadIndicator(container, device)

    // add the 'failed' icon, if necessary
    if (device.failed) {
      addExclamationMark(container, device, this.passiveSupported)
    }

    // set the location
    const dxContainer = node.layout.x
    const dyContainer = node.layout.y
    container.setAttribute('transform', `translate(${dxContainer} ${dyContainer})`)

    // cache the node's properties
    ;(container as any)['data-renderDataCache'] = new RenderDataCache(
      device.enabled,
      device.failed,
      device.load
    )

    return new SvgVisual(container)
  }

  /**
   * @see Overrides {@link NodeStyleBase.updateVisual}
   */
  updateVisual(context: IRenderContext, oldVisual: Visual, node: INode): SvgVisual {
    if (!(oldVisual instanceof SvgVisual)) {
      return this.createVisual(context, node)
    }

    const device = node.tag as Device
    const container = oldVisual.svgElement as SVGGElement
    const oldCache: RenderDataCache = (container as any)['data-renderDataCache']
    const newCache = new RenderDataCache(device.enabled, device.failed, device.load)

    // update the image
    const wasNodeWorking = oldCache.enabled && oldCache.failed
    const isNodeWorking = newCache.enabled && newCache.failed

    if (isNodeWorking !== wasNodeWorking) {
      const image = container.childNodes.item(0) as SVGImageElement
      image.setAttribute('class', isNodeWorking ? 'enabled' : 'disabled')
    }

    // update the load indicator
    if (!oldCache.equals(newCache)) {
      const loadIndicator = container.childNodes.item(1) as SVGEllipseElement
      updateLoadIndicator(device, loadIndicator)
    }

    // update the 'failed' icon
    if (oldCache.failed !== newCache.failed) {
      if (newCache.failed) {
        container.style.setProperty('cursor', 'pointer')
        addExclamationMark(container, device, this.passiveSupported)
      } else {
        container.style.removeProperty('cursor')
        removeExclamationMark(container)
      }
    }

    // update the cache
    ;(container as any)['data-renderDataCache'] = newCache

    // make sure that the location is up to date
    container.transform.baseVal.getItem(0).setTranslate(node.layout.x, node.layout.y)
    return oldVisual
  }

  /**
   * Gets the outline of the node, which is an elliptic shape in this case.
   * @see Overrides {@link NodeStyleBase.getOutline}
   */
  getOutline(node: INode): GeneralPath {
    const outline = new GeneralPath()
    outline.appendEllipse(node.layout, false)
    return outline
  }

  /**
   * Gets the intersection of a line with the visual representation of the node.
   * This method is implemented explicitly to optimize the performance for elliptic shape.
   * @see Overrides {@link NodeStyleBase.getIntersection}
   */
  getIntersection(node: INode, inner: Point, outer: Point): Point | null {
    return GeomUtilities.findEllipseLineIntersection(node.layout.toRect(), inner, outer)
  }

  /**
   * Determines whether the provided point is geometrically inside the visual bounds of the node.
   * This method is implemented explicitly to optimize the performance for elliptic shape.
   * @see Overrides {@link NodeStyleBase.isInside}
   */
  isInside(node: INode, point: Point): boolean {
    return GeomUtilities.ellipseContains(node.layout.toRect(), point, 0)
  }

  /**
   * Determines whether the visual representation of the node has been hit at the given location.
   * This method is implemented explicitly to optimize the performance for elliptic shape.
   * @see Overrides {@link NodeStyleBase.isHit}
   */
  isHit(canvasContext: IInputModeContext, location: Point, node: INode): boolean {
    return GeomUtilities.ellipseContains(
      node.layout.toRect(),
      location,
      canvasContext.hitTestRadius
    )
  }

  /**
   * Converts the given load to a color.
   * Returns a hex encoded color in the form 'hsla(h,s,l,a)'.
   */
  static convertLoadToColor(load: number, alpha: number): string {
    return `hsla(${(1 - load) * 120},80%,50%,${alpha})`
  }
}

class RenderDataCache {
  constructor(
    public readonly enabled: boolean,
    public readonly failed: boolean,
    public readonly load: number
  ) {}
  equals(other: RenderDataCache) {
    return (
      this.enabled === other.enabled && this.failed === other.failed && this.load === other.load
    )
  }
}

/**
 * Adds a load indicator to the given container.
 */
function addLoadIndicator(container: SVGGElement, device: Device): void {
  const loadIndicator = window.document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
  loadIndicator.setAttribute('cx', '0')
  loadIndicator.setAttribute('cy', '0')
  loadIndicator.setAttribute('rx', '6')
  loadIndicator.setAttribute('ry', '6')
  loadIndicator.setAttribute('stroke-width', '2')
  loadIndicator.setAttribute('stroke', '#FFF')
  loadIndicator.setAttribute('fill', DeviceStyle.convertLoadToColor(device.load, 1))

  // place the indicator individually for each node type
  loadIndicator.setAttribute('transform', getTranslation(device))

  // hide the indicator if the node is failed or disabled
  const isDeviceWorking = device.enabled && !device.failed
  if (!isDeviceWorking) {
    loadIndicator.setAttribute('display', 'none')
  }

  container.appendChild(loadIndicator)
}

/**
 * Updates the visibility and color of the load indicator.
 */
function updateLoadIndicator(device: Device, loadIndicator: SVGElement): void {
  const isDeviceWorking = device.enabled && !device.failed
  if (!isDeviceWorking) {
    loadIndicator.setAttribute('display', 'none')
  } else {
    loadIndicator.removeAttribute('display')
    loadIndicator.setAttribute('fill', DeviceStyle.convertLoadToColor(device.load, 1))
  }
}

/**
 * Adds the 'failed' icon to the given g element.
 * @param container The container to add the icon to.
 * @param device The Device to visualize.
 * @param passiveSupported Whether or not the browser supports active and passive event listeners.
 */
function addExclamationMark(
  container: SVGGElement,
  device: Device,
  passiveSupported: boolean
): void {
  const imageExclamation = window.document.createElementNS('http://www.w3.org/2000/svg', 'image')
  imageExclamation.setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'href',
    './resources/exclamation.svg'
  )
  imageExclamation.setAttribute('width', '24')
  imageExclamation.setAttribute('height', '24')
  imageExclamation.setAttribute('transform', 'translate(36,30)')
  imageExclamation.setAttribute('class', 'failed')
  imageExclamation.setAttribute('cursor', 'pointer')

  // add listeners that "repair" the failed device
  const repairDevice = (evt: Event): void => {
    device.failed = false
    device.enabled = true
    evt.stopImmediatePropagation()
  }
  imageExclamation.addEventListener('mousedown', repairDevice, true)
  imageExclamation.addEventListener(
    'touchstart',
    repairDevice,
    passiveSupported ? { passive: false } : true
  )

  container.appendChild(imageExclamation)
}

/**
 * Removes the 'failed' icon from the given g element.
 */
function removeExclamationMark(container: SVGGElement): void {
  while (container.childNodes.length > 2) {
    container.removeChild(container.lastChild!)
  }
}

function getImage(device: Device): string {
  switch (device.kind) {
    case DeviceKind.WORKSTATION:
      return './resources/workstation.svg'
    case DeviceKind.LAPTOP:
      return './resources/laptop.svg'
    case DeviceKind.SMARTPHONE:
      return './resources/smartphone.svg'
    case DeviceKind.SWITCH:
      return './resources/switch.svg'
    case DeviceKind.WLAN:
      return './resources/wlan.svg'
    case DeviceKind.SERVER:
      return './resources/server.svg'
    case DeviceKind.DATABASE:
      return './resources/database.svg'
    default:
      return './resources/workstation.svg'
  }
}

function getTranslation(device: Device): string {
  switch (device.kind) {
    case DeviceKind.WORKSTATION:
      return 'translate(48,15)'
    case DeviceKind.LAPTOP:
      return 'translate(45,15)'
    case DeviceKind.SMARTPHONE:
      return 'translate(42,17)'
    case DeviceKind.SWITCH:
      return 'translate(48,24)'
    case DeviceKind.WLAN:
      return 'translate(48,38)'
    case DeviceKind.SERVER:
      return 'translate(42,20)'
    case DeviceKind.DATABASE:
      return 'translate(42,18)'
    default:
      return 'translate(48,15)'
  }
}
