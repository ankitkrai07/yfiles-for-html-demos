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
  DefaultLabelStyle,
  Font,
  FontWeight,
  FreeNodeLabelModel,
  GraphComponent,
  GraphEditorInputMode,
  GraphItemTypes,
  HorizontalTextAlignment,
  ICommand,
  IGraph,
  ILabelModelParameter,
  Insets,
  LabelShape,
  License,
  SmartEdgeLabelModel,
  TextWrapping,
  VerticalTextAlignment
} from 'yfiles'

import { configureToolTips } from './ToolTipHelper.js'
import { bindCommand, showApp } from '../../resources/demo-app.js'
import { applyDemoTheme, colorSets, initDemoStyles } from '../../resources/demo-styles.js'
import { fetchLicense } from '../../resources/fetch-license.js'

/**
 * Runs the demo.
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()

  const graphComponent = new GraphComponent('#graphComponent')
  applyDemoTheme(graphComponent)
  const graph = graphComponent.graph
  initDemoStyles(graph)

  // Create node and edge labels using different label style settings
  createSampleNodeLabels(graph)
  createSampleEdgeLabels(graph)

  // Configure the interaction features and tool tips
  configureInteraction(graphComponent)

  // Initialize the UI and show the demo
  graphComponent.fitGraphBounds()
  initializeUI(graphComponent)
  showApp(graphComponent)
}

/**
 * Creates some sample node labels with different background styles.
 * @param {!IGraph} graph The graph to add node labels to.
 */
function createSampleNodeLabels(graph) {
  const n1 = graph.createNode({ layout: [-25, -100, 50, 200] })
  // Add sample node labels to the first node, distributed evenly on the side and with different
  // background shapes
  graph.addLabel({
    owner: n1,
    text: 'Rectangle Node Label',
    layoutParameter: createNodeLabelParameter([1, 0.2], [75, 0]),
    style: createNodeLabelStyle({ shape: LabelShape.RECTANGLE })
  })
  graph.addLabel({
    owner: n1,
    text: 'Rounded Node Label',
    layoutParameter: createNodeLabelParameter([1, 0.4], [75, 0]),
    style: createNodeLabelStyle({ shape: LabelShape.ROUND_RECTANGLE })
  })
  graph.addLabel({
    owner: n1,
    text: 'Hexagon Node Label',
    layoutParameter: createNodeLabelParameter([1, 0.6], [75, 0]),
    //The hexagon background needs slightly larger insets at the sides
    style: createNodeLabelStyle({ shape: LabelShape.HEXAGON, insets: new Insets(8, 4, 8, 4) })
  })
  graph.addLabel({
    owner: n1,
    text: 'Pill Node Label',
    layoutParameter: createNodeLabelParameter([1, 0.8], [75, 0]),
    style: createNodeLabelStyle({ shape: LabelShape.PILL })
  })

  // Create two more nodes, the bottom one and the right one
  graph.createNode({ layout: [275, 600, 50, 50] })
  const n3 = graph.createNode({ layout: [525, -100, 50, 200] })

  // Add three node labels to the right node showing different text clipping and text wrapping options
  graph.addLabel({
    owner: n3,
    text: `Wrapped and clipped label text`,
    layoutParameter: createNodeLabelParameter([1, 0.2], [110, 0]),
    style: createNodeLabelStyle({
      theme: 'demo-palette-12',
      shape: LabelShape.PILL,
      wrapping: TextWrapping.WORD_ELLIPSIS
    }),
    preferredSize: [100, 25]
  })

  graph.addLabel({
    owner: n3,
    text: `Un-wrapped but clipped label text`,
    layoutParameter: createNodeLabelParameter([1, 0.5], [110, 0]),
    style: createNodeLabelStyle({
      theme: 'demo-palette-12',
      shape: LabelShape.PILL,
      wrapping: TextWrapping.NONE
    }),
    preferredSize: [100, 25]
  })

  // For the last label, disable text clipping
  graph.addLabel({
    owner: n3,
    text: 'Un-wrapped and un-clipped label text',
    layoutParameter: createNodeLabelParameter([1, 0.8], [110, 0]),
    style: createNodeLabelStyle({
      theme: 'demo-palette-12',
      shape: LabelShape.PILL,
      wrapping: TextWrapping.NONE,
      clipText: false
    }),
    preferredSize: [100, 25]
  })
}

/**
 * Creates some sample edge labels with different background styles.
 * @param {!IGraph} graph The graph to add edge labels to.
 */
function createSampleEdgeLabels(graph) {
  const edgeLabelModel = new SmartEdgeLabelModel({
    angle: Math.PI / 2
  })

  graph.edgeDefaults.labels.layoutParameter = edgeLabelModel.createDefaultParameter()

  const edge1 = graph.createEdge(graph.nodes.get(0), graph.nodes.get(1))
  graph.addBend(edge1, [0, 400])

  //Add sample edge labels on the first edge segment, distributed evenly on the path and with different
  //background shapes
  graph.addLabel({
    owner: edge1,
    text: 'Rectangle Edge Label\n' + 'A second line of sample text.',
    layoutParameter: edgeLabelModel.createParameterFromSource(0, 0, 0.2),
    style: createEdgeLabelStyle({ shape: LabelShape.RECTANGLE })
  })
  graph.addLabel({
    owner: edge1,
    text: 'Rounded Edge Label\n' + 'A second line of sample text.',
    layoutParameter: edgeLabelModel.createParameterFromSource(0, 0, 0.4),
    style: createEdgeLabelStyle({ shape: LabelShape.ROUND_RECTANGLE })
  })
  graph.addLabel({
    owner: edge1,
    text: 'Hexagon Edge Label\n' + 'A second line of sample text.',
    layoutParameter: edgeLabelModel.createParameterFromSource(0, 0, 0.6),
    //The hexagon background needs slightly larger insets at the sides
    style: createEdgeLabelStyle({ shape: LabelShape.HEXAGON, insets: new Insets(16, 4, 16, 4) })
  })
  graph.addLabel({
    owner: edge1,
    text: 'Pill Edge Label\n' + 'A second line of sample text.',
    layoutParameter: edgeLabelModel.createParameterFromSource(0, 0, 0.8),
    //The pill background needs slightly larger insets at the sides
    style: createEdgeLabelStyle({ shape: LabelShape.PILL, insets: new Insets(8, 4, 8, 4) })
  })

  //Add rotated edge labels on the second edge segment, distributed evenly and with different
  //background shapes
  graph.addLabel({
    owner: edge1,
    text: 'Rotated Rectangle',
    layoutParameter: edgeLabelModel.createParameterFromSource(1, 0, 0.2),
    style: createEdgeLabelStyle({
      theme: 'demo-palette-12',
      shape: LabelShape.RECTANGLE,
      font: new Font('Monospace', 13)
    })
  })
  graph.addLabel({
    owner: edge1,
    text: 'Rotated Rounded Rectangle',
    layoutParameter: edgeLabelModel.createParameterFromSource(1, 0, 0.4),
    style: createEdgeLabelStyle({
      theme: 'demo-palette-12',
      shape: LabelShape.ROUND_RECTANGLE,
      font: new Font('Monospace', 13)
    })
  })
  graph.addLabel({
    owner: edge1,
    text: 'Rotated Hexagon',
    layoutParameter: edgeLabelModel.createParameterFromSource(1, 0, 0.6),
    //The hexagon background needs slightly larger insets at the sides
    style: createEdgeLabelStyle({
      theme: 'demo-palette-12',
      shape: LabelShape.HEXAGON,
      insets: new Insets(8, 4, 8, 4),
      font: new Font('Monospace', 13)
    })
  })
  graph.addLabel({
    owner: edge1,
    text: 'Rotated Pill',
    layoutParameter: edgeLabelModel.createParameterFromSource(1, 0, 0.8),
    style: createEdgeLabelStyle({
      theme: 'demo-palette-12',
      shape: LabelShape.PILL,
      font: new Font('Monospace', 13)
    })
  })

  const edge2 = graph.createEdge(graph.nodes.get(2), graph.nodes.get(1))
  graph.addBend(edge2, [550, 625])

  // Add larger edge labels with different vertical and horizontal text alignment settings to the second edge
  graph.addLabel({
    owner: edge2,
    text: 'Edge Label\nwith vertical text\nalignment at bottom',
    layoutParameter: edgeLabelModel.createParameterFromSource(0, -20, 0.4),
    style: createEdgeLabelStyle({
      theme: 'demo-palette-14',
      shape: LabelShape.ROUND_RECTANGLE,
      font: new Font('sans-serif', 13, null, FontWeight.BOLD),
      verticalTextAlignment: VerticalTextAlignment.BOTTOM
    }),
    // Explicitly specify a preferred size for the label that is much larger than needed for the label's text
    preferredSize: [150, 120]
  })
  graph.addLabel({
    owner: edge2,
    text: 'Edge Label\nwith vertical text\nalignment at top',
    layoutParameter: edgeLabelModel.createParameterFromSource(0, 20, 0.4),
    style: createEdgeLabelStyle({
      theme: 'demo-palette-14',
      shape: LabelShape.ROUND_RECTANGLE,
      font: new Font('sans-serif', 13, null, FontWeight.BOLD),
      verticalTextAlignment: VerticalTextAlignment.TOP
    }),
    // Explicitly specify a preferred size for the label that is much larger than needed for the label's text
    preferredSize: [150, 120]
  })
  graph.addLabel({
    owner: edge2,
    text: 'Edge Label\nwith vertical center\nand horizontal left\ntext alignment',
    layoutParameter: edgeLabelModel.createParameterFromSource(0, 20, 0.7),
    style: createEdgeLabelStyle({
      theme: 'demo-palette-14',
      shape: LabelShape.ROUND_RECTANGLE,
      font: new Font('sans-serif', 13, null, FontWeight.BOLD),
      verticalTextAlignment: VerticalTextAlignment.CENTER,
      horizontalTextAlignment: HorizontalTextAlignment.LEFT
    }),
    // Explicitly specify a preferred size for the label that is much larger than needed for the label's text
    preferredSize: [150, 120]
  })
  graph.addLabel({
    owner: edge2,
    text: 'Edge Label\nwith vertical bottom\nand horizontal right\ntext alignment',
    layoutParameter: edgeLabelModel.createParameterFromSource(0, -20, 0.7),
    style: createEdgeLabelStyle({
      theme: 'demo-palette-14',
      shape: LabelShape.ROUND_RECTANGLE,
      font: new Font('sans-serif', 13, null, FontWeight.BOLD),
      verticalTextAlignment: VerticalTextAlignment.BOTTOM,
      horizontalTextAlignment: HorizontalTextAlignment.RIGHT
    }),
    // Explicitly specify a preferred size for the label that is much larger than needed for the label's text
    preferredSize: [150, 120]
  })
}

/**
 * Creates and configures a node label style.
 * @param theme The name of the color set to use for the style's fills and stroke.
 * @param shape The label shape for the background.
 * @param font The font for the label text.
 * @param insets Optional insets to account for special background shapes.
 * @param wrapping The optional text wrapping defining how text of the label is trimmed.
 * @param verticalTextAlignment The vertical text alignment.
 * @param horizontalTextAlignment The horizontal text alignment.
 * @param clipText Determines whether overflowing text shold be clipped.
 * @param {!object} undefined
 * @returns {!DefaultLabelStyle}
 */
function createNodeLabelStyle({
  theme = 'demo-orange',
  shape = LabelShape.RECTANGLE,
  font = new Font('Arial', 12),
  insets = new Insets(4),
  wrapping = TextWrapping.NONE,
  verticalTextAlignment = VerticalTextAlignment.CENTER,
  horizontalTextAlignment = HorizontalTextAlignment.CENTER,
  clipText = true
} = {}) {
  return new DefaultLabelStyle({
    shape,
    backgroundFill: colorSets[theme].nodeLabelFill,
    backgroundStroke: colorSets[theme].stroke,
    font,
    textFill: colorSets[theme].text,
    insets,
    wrapping,
    verticalTextAlignment,
    horizontalTextAlignment,
    clipText
  })
}

/**
 * Creates and configures an edge label style.
 * @param theme The name of the color set to use for the style's fills and stroke.
 * @param shape The label shape for the background.
 * @param font The font for the label text.
 * @param insets Optional insets to account for special background shapes.
 * @param wrapping The optional text wrapping defining how text of the label is trimmed.
 * @param verticalTextAlignment The vertical text alignment.
 * @param horizontalTextAlignment The horizontal text alignment.
 * @param {!object} undefined
 * @returns {!DefaultLabelStyle}
 */
function createEdgeLabelStyle({
  theme = 'demo-orange',
  shape = LabelShape.RECTANGLE,
  font = new Font('Arial', 12),
  insets = new Insets(4),
  wrapping = TextWrapping.NONE,
  verticalTextAlignment = VerticalTextAlignment.CENTER,
  horizontalTextAlignment = HorizontalTextAlignment.CENTER
} = {}) {
  return new DefaultLabelStyle({
    shape,
    backgroundFill: colorSets[theme].edgeLabelFill,
    backgroundStroke: colorSets[theme].stroke,
    font,
    textFill: colorSets[theme].text,
    insets,
    wrapping,
    verticalTextAlignment,
    horizontalTextAlignment
  })
}

/**
 * Creates a node label at the specified vertical ratio.
 * @param {!Array.<number>} layoutRatio The ratio that describes the point on the node's layout relative to its upper-left corner.
 * @param {!Array.<number>} layoutOffset The absolute offset to apply to the point on the node after the ratio has been determined.
 * @returns {!ILabelModelParameter}
 */
function createNodeLabelParameter(layoutRatio, layoutOffset) {
  return FreeNodeLabelModel.INSTANCE.createParameter({
    layoutRatio,
    layoutOffset,
    labelRatio: [0.5, 0.5]
  })
}

/**
 * Configures the interaction behavior to allow only some graph modifications and configures
 * the tool tips.
 * @param {!GraphComponent} graphComponent
 */
function configureInteraction(graphComponent) {
  const inputMode = new GraphEditorInputMode({
    allowGroupingOperations: false,
    marqueeSelectableItems: GraphItemTypes.LABEL
  })
  graphComponent.inputMode = inputMode

  configureToolTips(inputMode)
}

/**
 * Initializes the UI elements.
 * @param {!GraphComponent} graphComponent
 */
function initializeUI(graphComponent) {
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)
}

// noinspection JSIgnoredPromiseFromCall
run()
