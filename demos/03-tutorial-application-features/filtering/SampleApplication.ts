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
  DefaultGraph,
  DefaultLabelStyle,
  EdgePathLabelModel,
  EdgeSides,
  ExteriorLabelModel,
  FilteredGraphWrapper,
  GraphComponent,
  GraphEditorInputMode,
  GraphItemTypes,
  GroupNodeLabelModel,
  GroupNodeStyle,
  ICommand,
  IEdge,
  IGraph,
  INode,
  License,
  Point,
  Size,
  UndoUnitBase
} from 'yfiles'

import { bindAction, bindCommand, showApp } from '../../resources/demo-app'
import { applyDemoTheme, initDemoStyles } from '../../resources/demo-styles'
import { fetchLicense } from '../../resources/fetch-license'

/**
 * Application Features - Filtering
 *
 * This demo shows how to enable filtering on an {@link IGraph}.
 * Filtering temporarily removes nodes or edges from the graph.
 */
let graphComponent: GraphComponent

/**
 * Bootstraps the demo.
 */
async function run(): Promise<void> {
  License.value = await fetchLicense()
  // Initialize the GraphComponent
  graphComponent = new GraphComponent('#graphComponent')
  applyDemoTheme(graphComponent)

  // Creates a new GraphEditorInputMode instance and registers it as the main
  // input mode for the graphComponent
  graphComponent.inputMode = new GraphEditorInputMode({
    allowGroupingOperations: true,
    selectableItems: GraphItemTypes.NODE | GraphItemTypes.EDGE
  })

  // create the filtered Graph
  const filteredGraph = createFilterGraph()

  // assign the filtered graph to the graph component
  graphComponent.graph = filteredGraph

  // fullGraph is the Original graph wrapped by the filtered Graph
  const fullGraph = filteredGraph.wrappedGraph!

  // make sure state tags are on all created items
  fullGraph.addNodeCreatedListener((sender, evt) => (evt.item.tag = { filtered: false }))
  fullGraph.addEdgeCreatedListener((sender, evt) => (evt.item.tag = { filtered: false }))

  // create an initial sample graph
  createInitialGraph(fullGraph)
  graphComponent.fitGraphBounds()

  // Finally, enable the undo engine. This prevents undoing of the graph creation
  graphComponent.graph.undoEngineEnabled = true

  // update the reset filter button depending on the current graph state
  graphComponent.graph.undoEngine!.addUnitUndoneListener(updateResetButtonState)
  graphComponent.graph.undoEngine!.addUnitRedoneListener(updateResetButtonState)

  // bind the buttons to their commands
  registerCommands()

  // initialize the application's CSS and JavaScript for the description
  showApp(graphComponent)
}

/**
 * Creates a filtered graph which wraps the full graph.
 *
 * @return The filtered graph.
 */
function createFilterGraph(): FilteredGraphWrapper {
  // the unfiltered, unfolded master graph
  const fullGraph = new DefaultGraph()

  // set default styles for newly created graph elements
  initTutorialDefaults(fullGraph)

  // we want to hide items whose tag contains the string 'filtered'
  const nodePredicate = (node: INode): boolean => !node.tag || !node.tag.filtered
  const edgePredicate = (edge: IEdge): boolean => !edge.tag || !edge.tag.filtered

  // create a filtered graph
  return new FilteredGraphWrapper(fullGraph, nodePredicate, edgePredicate)
}

/**
 * Hides the selected items.
 */
function filterItems(): void {
  // mark the selected items such that the nodePredicate or edgePredicate will filter them
  graphComponent.selection.selectedNodes.forEach(node => {
    filterItemWithUndoUnit(node, true)
  })
  graphComponent.selection.selectedEdges.forEach(edge => {
    filterItemWithUndoUnit(edge, true)
  })

  // re-evaluate the filter predicates to actually hide the items
  const filteredGraph = graphComponent.graph as FilteredGraphWrapper
  filteredGraph.nodePredicateChanged()
  filteredGraph.edgePredicateChanged()
}

/**
 * Restores the filtered items.
 */
function restoreItems(): void {
  // access the unfiltered, unfolded graph to remove the filter mark from all items
  const filteredGraph = graphComponent.graph as FilteredGraphWrapper
  const fullGraph = filteredGraph.wrappedGraph!
  fullGraph.nodes.forEach(node => {
    filterItemWithUndoUnit(node, false)
  })
  fullGraph.edges.forEach(edge => {
    filterItemWithUndoUnit(edge, false)
  })

  // re-evaluate the filter predicates to actually show the items again
  filteredGraph.nodePredicateChanged()
  filteredGraph.edgePredicateChanged()
}

/**
 * Changes the filtered state of the tag of an edge or node while also adding an undo unit for it.
 */
function filterItemWithUndoUnit(item: INode | IEdge, state: boolean): void {
  graphComponent.graph.undoEngine!.addUnit(
    new ChangeFilterStateUndoUnit(graphComponent.graph as FilteredGraphWrapper, item.tag)
  )
  item.tag.filtered = state
}

/**
 * Initializes the defaults for the styling in this tutorial.
 *
 * @param graph The graph.
 */
function initTutorialDefaults(graph: IGraph): void {
  // set styles that are the same for all tutorials
  initDemoStyles(graph)

  // set the style, label and label parameter for group nodes
  graph.groupNodeDefaults.style = new GroupNodeStyle({
    tabFill: '#242265',
    tabPosition: 'top-trailing',
    stroke: '2px solid #242265',
    cornerRadius: 8,
    tabWidth: 70,
    contentAreaInsets: 8
  })
  graph.groupNodeDefaults.labels.style = new DefaultLabelStyle({
    horizontalTextAlignment: 'right',
    textFill: '#FFF',
    insets: [0, 10, 0, 0]
  })
  graph.groupNodeDefaults.labels.layoutParameter =
    new GroupNodeLabelModel().createDefaultParameter()

  // set sizes and locations specific for this tutorial
  graph.nodeDefaults.size = new Size(40, 40)
  graph.nodeDefaults.labels.layoutParameter = new ExteriorLabelModel({
    insets: 5
  }).createParameter('south')
  graph.edgeDefaults.labels.layoutParameter = new EdgePathLabelModel({
    distance: 5,
    autoRotation: true
  }).createRatioParameter({ sideOfEdge: EdgeSides.BELOW_EDGE })
}

/**
 * Creates an initial sample graph.
 *
 * @param graph The graph.
 */
function createInitialGraph(graph: IGraph): void {
  const node1 = graph.createNodeAt([110, 20])
  const node2 = graph.createNodeAt([145, 95])
  const node3 = graph.createNodeAt([75, 95])
  const node4 = graph.createNodeAt([30, 175])
  const node5 = graph.createNodeAt([100, 175])

  graph.groupNodes({ children: [node1, node2, node3], labels: ['Group 1'] })

  const edge1 = graph.createEdge(node1, node2)
  const edge2 = graph.createEdge(node1, node3)
  const edge3 = graph.createEdge(node3, node4)
  const edge4 = graph.createEdge(node3, node5)
  const edge5 = graph.createEdge(node1, node5)
  graph.setPortLocation(edge1.sourcePort!, new Point(123.33, 40))
  graph.setPortLocation(edge1.targetPort!, new Point(145, 75))
  graph.setPortLocation(edge2.sourcePort!, new Point(96.67, 40))
  graph.setPortLocation(edge2.targetPort!, new Point(75, 75))
  graph.setPortLocation(edge3.sourcePort!, new Point(65, 115))
  graph.setPortLocation(edge3.targetPort!, new Point(30, 155))
  graph.setPortLocation(edge4.sourcePort!, new Point(85, 115))
  graph.setPortLocation(edge4.targetPort!, new Point(90, 155))
  graph.setPortLocation(edge5.sourcePort!, new Point(110, 40))
  graph.setPortLocation(edge5.targetPort!, new Point(110, 155))
  graph.addBends(edge1, [new Point(123.33, 55), new Point(145, 55)])
  graph.addBends(edge2, [new Point(96.67, 55), new Point(75, 55)])
  graph.addBends(edge3, [new Point(65, 130), new Point(30, 130)])
  graph.addBends(edge4, [new Point(85, 130), new Point(90, 130)])
}

/**
 * Binds the various commands available in yFiles for HTML to the buttons in the tutorial's toolbar.
 */
function registerCommands(): void {
  bindAction("button[data-command='New']", (): void => {
    graphComponent.graph.clear()
    ICommand.FIT_GRAPH_BOUNDS.execute(null, graphComponent)
  })
  bindCommand("button[data-command='Cut']", ICommand.CUT, graphComponent)
  bindCommand("button[data-command='Copy']", ICommand.COPY, graphComponent)
  bindCommand("button[data-command='Paste']", ICommand.PASTE, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)
  bindCommand("button[data-command='Undo']", ICommand.UNDO, graphComponent)
  bindCommand("button[data-command='Redo']", ICommand.REDO, graphComponent)
  bindCommand("button[data-command='GroupSelection']", ICommand.GROUP_SELECTION, graphComponent)
  bindCommand("button[data-command='UngroupSelection']", ICommand.UNGROUP_SELECTION, graphComponent)

  bindAction("button[data-command='FilterItems']", (): void => {
    // filtering items
    filterItems()
    // enable the reset button
    ;(document.querySelector("button[data-command='ResetFilter']") as HTMLButtonElement)!.disabled =
      false
  })

  bindAction("button[data-command='ResetFilter']", () => {
    // restoring items
    restoreItems()
    // disable the reset button
    ;(document.querySelector("button[data-command='ResetFilter']") as HTMLButtonElement)!.disabled =
      true
  })

  // adds a listener for the current selection to enable/disable the filter button
  graphComponent.selection.addItemSelectionChangedListener(() => {
    ;(document.querySelector("button[data-command='FilterItems']") as HTMLButtonElement)!.disabled =
      graphComponent.selection.size === 0
  })
}

/**
 * Updates the 'Reset Filter' button state based on the current graph state.
 */
function updateResetButtonState(): void {
  const fullGraph = (graphComponent.graph as FilteredGraphWrapper).wrappedGraph!
  const hasFilteredItems =
    fullGraph.nodes.some(node => node.tag && node.tag.filtered) ||
    fullGraph.edges.some(edge => edge.tag && edge.tag.filtered)
  // set the reset button
  ;(document.querySelector("button[data-command='ResetFilter']") as HTMLButtonElement)!.disabled =
    !hasFilteredItems
}

/**
 * An undo unit to keep track of the filtered state changes on the graph items.
 */
class ChangeFilterStateUndoUnit extends UndoUnitBase {
  private filteredGraph: FilteredGraphWrapper
  private tag: { filtered: boolean }
  private readonly oldState: boolean
  private newState = false

  constructor(filteredGraph: FilteredGraphWrapper, tag: { filtered: boolean }) {
    super('ChangeFilterState')
    this.filteredGraph = filteredGraph
    // remember the changed object
    this.tag = tag
    // remember the old value
    this.oldState = this.tag.filtered
  }

  undo(): void {
    // remember the new value for redo
    this.newState = this.tag.filtered
    // set the old value
    this.tag.filtered = this.oldState
    this.filteredGraph.nodePredicateChanged()
    this.filteredGraph.edgePredicateChanged()
  }

  redo(): void {
    // set the new value
    this.tag.filtered = this.newState
    this.filteredGraph.nodePredicateChanged()
    this.filteredGraph.edgePredicateChanged()
  }
}

// noinspection JSIgnoredPromiseFromCall
run()
