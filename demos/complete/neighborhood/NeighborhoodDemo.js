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
  FoldingManager,
  GraphComponent,
  GraphItemTypes,
  GraphMLIOHandler,
  GraphMLSupport,
  GraphViewerInputMode,
  ICommand,
  IEnumerable,
  INode,
  License,
  List,
  NodeStyleDecorationInstaller,
  StorageLocation,
  StyleDecorationZoomPolicy,
  TemplateNodeStyle
} from 'yfiles'

import NeighborhoodView from './NeighborhoodView.js'
import {
  addNavigationButtons,
  bindChangeListener,
  bindCommand,
  readGraph,
  showApp
} from '../../resources/demo-app.js'
import { applyDemoTheme, initDemoStyles } from '../../resources/demo-styles.js'
import { fetchLicense } from '../../resources/fetch-license.js'

/**
 * The GraphComponent
 * @type {GraphComponent}
 */
let graphComponent

/**
 * The NeighborhoodView.
 * @type {NeighborhoodView}
 */
let neighborhoodView

// get hold of some UI elements
const graphChooserBox = document.getElementById('graphChooserBox')
const neighborhoodModeChooserBox = document.getElementById('neighborhoodModeChooserBox')
const neighborhoodMaxDistanceSlider = document.getElementById('neighborhoodMaxDistanceSlider')

/**
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()
  // initialize the GraphComponent
  graphComponent = new GraphComponent('graphComponent')

  // wire up the UI
  registerCommands()

  // use the file system for built-in I/O
  enableGraphML()

  // // first initialize the graph component
  initializeGraphComponent()
  initializeNeighborhoodView()
  initializeHighlighting()

  // initializes the graphs' combobox
  if (graphChooserBox !== null) {
    ;['social-network', 'computer-network', 'orgchart', 'nesting'].forEach(sample => {
      const option = document.createElement('option')
      option.text = sample
      option.value = sample
      graphChooserBox.add(option)
    })
  }

  // initializes the neighborhood modes' combobox
  if (neighborhoodModeChooserBox !== null) {
    ;['Neighbors', 'Predecessors', 'Successors', 'Both', 'FolderContents'].forEach(sample => {
      const option = document.createElement('option')
      option.text = sample
      option.value = sample
      neighborhoodModeChooserBox.add(option)
    })
  }

  neighborhoodMaxDistanceSlider.min = '1'
  neighborhoodMaxDistanceSlider.max = '5'
  neighborhoodMaxDistanceSlider.value = '1'

  neighborhoodMaxDistanceSlider.addEventListener(
    'change',
    () => {
      neighborhoodView.maxDistance = parseInt(neighborhoodMaxDistanceSlider.value)
      document.getElementById('neighborhoodMaxDistanceLabel').textContent =
        neighborhoodMaxDistanceSlider.value.toString()
    },
    true
  )

  // creates the input mode
  graphComponent.inputMode = createEditorMode()

  // initialize the graph and the defaults
  initConverters()
  initDemoStyles(graphComponent.graph, { foldingEnabled: true })

  // reads the sample graph
  readSampleGraph()

  // initialize the demo
  showApp(graphComponent)
}

/**
 * Enables loading and saving the graph to GraphML.
 */
function enableGraphML() {
  // create a new GraphMLSupport instance that handles save and load operations
  new GraphMLSupport({
    graphComponent,
    // configure to load and save to the file system
    storageLocation: StorageLocation.FILE_SYSTEM
  })
}

/**
 * Initializes the graph component
 */
function initializeGraphComponent() {
  // enables graph folding
  enableFolding()

  graphComponent.selection.addItemSelectionChangedListener(onItemSelectedDeselected)
}

/**
 * Called when the graph selection changes, e.g. nodes/edges are selected/deselected.
 */
function onItemSelectedDeselected() {
  if (INode.isInstance(graphComponent.currentItem)) {
    const nodes = new List(graphComponent.selection.selectedNodes)
    highlightNodes(nodes)
  }
}

/**
 * Enable folding - change the GraphComponents graph to a managed view
 * that provides the actual collapse/expand state.
 */
function enableFolding() {
  // create the manager
  const foldingManager = new FoldingManager()
  // replace the displayed graph with a managed view
  graphComponent.graph = foldingManager.createFoldingView().graph
}

/**
 * Initialize network view.
 */
function initializeNeighborhoodView() {
  neighborhoodView = new NeighborhoodView('neighborhoodGraphComponent')
  neighborhoodView.graphComponent = graphComponent
  neighborhoodView.useSelection = true
  // mirror navigation in the neighborhood view to the graph component
  neighborhoodView.clickCallback = node => {
    graphComponent.currentItem = node
    graphComponent.selection.clear()
    graphComponent.selection.setSelected(node, true)
    const nodes = new List(graphComponent.selection.selectedNodes)
    highlightNodes(nodes)
  }
  applyDemoTheme(neighborhoodView.neighborhoodComponent)
}

/**
 * Helper method to highlight a given node.
 * @param {!IEnumerable.<INode>} nodes
 */
function highlightNodes(nodes) {
  const manager = graphComponent.highlightIndicatorManager
  manager.clearHighlights()
  nodes.forEach(node => {
    manager.addHighlight(node)
  })
}

/**
 * Helper method to initialize the highlighting of the graph.
 */
function initializeHighlighting() {
  // we use the same highlight style as the Neighborhood View default highlight style
  const highlightShape = neighborhoodView.highlightStyle

  const nodeStyleHighlight = new NodeStyleDecorationInstaller({
    // that should be slightly larger than the real node
    margins: 5,
    // but have a fixed size in the view coordinates
    zoomPolicy: StyleDecorationZoomPolicy.VIEW_COORDINATES,
    nodeStyle: highlightShape
  })

  // now decorate the nodes with custom highlight styles
  const decorator = graphComponent.graph.decorator
  // register it as the default implementation for all nodes
  decorator.nodeDecorator.highlightDecorator.setImplementation(nodeStyleHighlight)

  // hide default selection and focus implementation
  decorator.nodeDecorator.selectionDecorator.hideImplementation()
  decorator.nodeDecorator.focusIndicatorDecorator.hideImplementation()
}

/**
 * Creates the input mode for the {@link GraphComponent}.
 * @returns {!GraphViewerInputMode} a new {@link GraphViewerInputMode} instance
 */
function createEditorMode() {
  // create default interaction with snapping and orthogonal edge editing
  const graphViewerInputMode = new GraphViewerInputMode({
    clickableItems: GraphItemTypes.NODE,
    focusableItems: GraphItemTypes.NODE,
    selectableItems: GraphItemTypes.NODE,
    marqueeSelectableItems: GraphItemTypes.NODE
  })

  // We enable folding with collapsing and expanding group nodes.
  graphViewerInputMode.navigationInputMode.allowCollapseGroup = true
  graphViewerInputMode.navigationInputMode.allowExpandGroup = true
  graphViewerInputMode.navigationInputMode.fitContentAfterGroupActions = false
  graphViewerInputMode.navigationInputMode.useCurrentItemForCommands = true

  return graphViewerInputMode
}

/**
 * Wire up the UI...
 */
function registerCommands() {
  // called by the demo framework initially so that the button commands can be bound to actual commands and actions
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent, null)
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent, null)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent, null)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)

  bindChangeListener("select[data-command='SelectedFileChanged']", readSampleGraph)
  addNavigationButtons(graphChooserBox)

  bindChangeListener("select[data-command='NeighborhoodModeChanged']", () => {
    onNeighborhoodModeChanged()
  })
  addNavigationButtons(neighborhoodModeChooserBox)
}

/**
 * Updates the NeighborhoodView's mode when the select box index changes.
 */
function onNeighborhoodModeChanged() {
  switch (neighborhoodModeChooserBox.selectedIndex) {
    case 0:
      neighborhoodMaxDistanceSlider.disabled = false
      neighborhoodView.neighborhoodMode = NeighborhoodView.MODE_NEIGHBORHOOD
      break
    case 1:
      neighborhoodMaxDistanceSlider.disabled = false
      neighborhoodView.neighborhoodMode = NeighborhoodView.MODE_PREDECESSORS
      break
    case 2:
      neighborhoodMaxDistanceSlider.disabled = false
      neighborhoodView.neighborhoodMode = NeighborhoodView.MODE_SUCCESSORS
      break
    case 3:
      neighborhoodMaxDistanceSlider.disabled = false
      neighborhoodView.neighborhoodMode = NeighborhoodView.MODE_BOTH
      break
    case 4:
      neighborhoodMaxDistanceSlider.disabled = true
      neighborhoodView.neighborhoodMode = NeighborhoodView.MODE_FOLDER_CONTENTS
      break
    default:
      neighborhoodMaxDistanceSlider.disabled = false
      neighborhoodView.neighborhoodMode = NeighborhoodView.MODE_NEIGHBORHOOD
  }
  neighborhoodView.selectedNodes = new List(graphComponent.selection.selectedNodes)
}

/**
 * Helper method that reads the currently selected graphml from the combobox.
 * @returns {!Promise}
 */
async function readSampleGraph() {
  // Disable navigation buttons while graph is loaded
  graphChooserBox.disabled = true

  // first derive the file name
  const selectedItem = graphChooserBox.options[graphChooserBox.selectedIndex].value
  const fileName = `resources/${selectedItem}.graphml`

  await readGraph(new GraphMLIOHandler(), graphComponent.graph, fileName)
  // when done - fit the bounds
  ICommand.FIT_GRAPH_BOUNDS.execute(null, graphComponent)
  // re-enable navigation buttons
  setTimeout(() => (graphChooserBox.disabled = false), 10)
  // update NeighborhoodView
  graphComponent.currentItem = graphComponent.graph.nodes.at(0) ?? null
  if (INode.isInstance(graphComponent.currentItem)) {
    const nodes = new List(graphComponent.selection.selectedNodes)
    highlightNodes(nodes)
  }
}

/**
 * Initializes the converters for the org chart styles.
 */
function initConverters() {
  // add the linebreak converter for the orgchart sample graph
  const store = {}
  TemplateNodeStyle.CONVERTERS.orgchartconverters = store
  store.linebreakconverter = (value, firstline) => {
    if (typeof value === 'string') {
      let copy = value
      while (copy.length > 20 && copy.indexOf(' ') > -1) {
        copy = copy.substring(0, copy.lastIndexOf(' '))
      }
      if (firstline === 'true') {
        return copy
      }
      return value.substring(copy.length)
    }
    return ''
  }
}

// noinspection JSIgnoredPromiseFromCall
run()
