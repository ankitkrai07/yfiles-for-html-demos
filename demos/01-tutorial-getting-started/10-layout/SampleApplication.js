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
  Class,
  DefaultLabelStyle,
  EdgePathLabelModel,
  EdgeSides,
  GraphBuilder,
  GraphComponent,
  GraphEditorInputMode,
  GraphItemTypes,
  GraphOverviewComponent,
  GroupNodeLabelModel,
  GroupNodeStyle,
  HierarchicLayout,
  ICommand,
  IModelItem,
  INode,
  ItemEventArgs,
  LayoutExecutor,
  License,
  Mapper,
  MinimumNodeSizeStage,
  MouseHoverInputMode,
  Point,
  PolylineEdgeStyle,
  PopulateItemContextMenuEventArgs,
  QueryItemToolTipEventArgs,
  ShapeNodeStyle,
  Size,
  ToolTipQueryEventArgs
} from 'yfiles'

import ContextMenu from '../../utils/ContextMenu.js'
import { bindAction, bindCommand, showApp } from '../../resources/demo-app.js'
import GraphBuilderData from './resources/graph.js'
import { fetchLicense } from '../../resources/fetch-license.js'

/** @type {GraphComponent} */
let graphComponent = null

/** @type {Mapper.<IModelItem,Date>} */
let dateMapper = null

/**
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()
  // Initialize the GraphComponent and place it in the div with CSS selector #graphComponent
  graphComponent = new GraphComponent('#graphComponent')

  // Enable grouping
  configureGroupNodeStyles()

  // Configure interaction
  configureInteraction()

  // Sets up the data binding
  enableDataBinding()

  // Displays tooltips for the stored data items, so that something is visible to the user
  setupTooltips()

  // Add a context menu to nodes
  setupContextMenu()

  // Configures default label model parameters for newly created graph elements
  setDefaultLabelLayoutParameters()

  // Configures default styles for newly created graph elements
  setDefaultStyles()

  // /////////////// New in this Sample /////////////////

  // Read a sample graph from an embedded resource file
  createSampleGraph()
  // ////////////////////////////////////////////////////

  // Enables the undo engine (disabled by default)
  enableUndo()

  // Manages the viewport
  updateViewport()

  // bind the demo buttons to their commands
  registerCommands()

  // Initialize the demo application's CSS and Javascript for the description
  showApp(graphComponent)
}

// /////////////// New in this Sample /////////////////

/**
 * Applies a hierarchic layout.
 * @returns {!Promise}
 */
async function runLayout() {
  // We need to load the 'view-layout-bridge' module explicitly to prevent tree-shaking
  // tools it from removing this dependency which is needed for 'morphLayout'.
  Class.ensure(LayoutExecutor)

  const layoutButton = document.getElementById('layout-btn')
  layoutButton.disabled = true
  // Uses the morphLayout method to perform the layout, animate it, manage undo and adjust the content rectangle in
  // one call. Here, the actual layout is wrapped into a MinimumNodeSizeStage to avoid errors with nodes of size '0'.
  // morphLayout runs asynchronously and returns immediately yielding a Promise that we can await or use to catch
  // errors.
  try {
    await graphComponent.morphLayout({
      layout: new MinimumNodeSizeStage(new HierarchicLayout()),
      morphDuration: '1s',
      easedAnimation: true
    })
  } catch (error) {
    // this is just for the purpose of the demo - usually you would employ your own
    // logging or error handling logic, here
    if (typeof window.reportError === 'function') {
      window.reportError(error)
    } else {
      throw error
    }
  } finally {
    layoutButton.disabled = false
  }
  /*
  // Alternatively we can do this directly on the graph, without animation
  const graph = graphComponent.graph
  graph.applyLayout(new HierarchicLayout())

  // Fitting the graph bounds is done by morphLayout() at the end but not by applyLayout(), which does not know
  // about the component.
  graphComponent.fitGraphBounds()
  */
}

/**
 * Creates the sample graph.
 */
function createSampleGraph() {
  const builder = new GraphBuilder(graphComponent.graph)
  builder.createNodesSource({
    data: GraphBuilderData.nodes,
    id: 'id',
    parentId: 'parent',
    layout: 'layout',
    labels: ['label']
  })
  builder.createGroupNodesSource({
    data: GraphBuilderData.groups,
    id: 'id',
    layout: 'layout',
    labels: ['label']
  })
  builder.createEdgesSource(GraphBuilderData.edges, 'source', 'target', 'id')

  builder.buildGraph()
}

// ////////////////////////////////////////////////////

/**
 * Sets up simple data binding - creates an IMapper, registers it and subscribe to the node creation event
 * on the graph.
 */
function enableDataBinding() {
  // Creates a specialized IMapper instance, and registers it under a symbolic name.
  dateMapper = new Mapper()

  // Subscribes to the node creation event to record the node creation time.
  // Note that since this event is triggered after undo/redo, the time will
  // be updated during redo of node creations and undo of node deletions.
  // If this is unwanted behavior, you can customize the node creation itself
  // to associate this data with the element at the time of its initial creation,
  // e.g. by listening to the NodeCreated event of GraphEditorInputMode, see below
  graphComponent.graph.addNodeCreatedListener((source, eventArgs) => {
    // Stores the current time as node creation time.
    dateMapper.set(eventArgs.item, new Date())
  })
  // Alternatively (or in addition) we could use the event for
  // interactive node creation as follows, provided that the input mode
  // for the graph control is already set.
  graphComponent.inputMode.addNodeCreatedListener((sender, args) => {
    dateMapper.set(args.item, new Date())
  })
}

/**
 * Setup tooltips that return the value that is stored in the mapper.
 * Dynamic tooltips are implemented by adding a tooltip provider as an event handler for
 * the {@link MouseHoverInputMode.addQueryToolTipListener QueryToolTip} event of the
 * GraphEditorInputMode using the
 * {@link ToolTipQueryEventArgs} parameter.
 * The {@link ToolTipQueryEventArgs} parameter provides three relevant properties:
 * Handled, QueryLocation, and ToolTip. The Handled property is a flag which indicates
 * whether the tooltip was already set by one of possibly several tooltip providers. The
 * QueryLocation property contains the mouse position for the query in world coordinates.
 * The tooltip is set by setting the ToolTip property.
 */
function setupTooltips() {
  if (graphComponent.inputMode instanceof GraphEditorInputMode) {
    const graphEditorInputMode = graphComponent.inputMode
    graphEditorInputMode.toolTipItems = GraphItemTypes.NODE
    graphEditorInputMode.addQueryItemToolTipListener((src, eventArgs) => {
      if (eventArgs.handled) {
        // Tooltip content has already been assigned -> nothing to do.
        return
      }
      const item = eventArgs.item
      if (INode.isInstance(item)) {
        // Set the tooltip content.
        eventArgs.toolTip = dateMapper.get(item).toLocaleString()

        // Indicate that the tooltip content has been set.
        eventArgs.handled = true
      }
    })

    // Add a little offset to the tooltip such that it is not obscured by the mouse pointer.
    graphEditorInputMode.mouseHoverInputMode.toolTipLocationOffset = new Point(20, 20)
  }
}

/**
 * Adds a context menu for nodes.
 */
function setupContextMenu() {
  const inputMode = graphComponent.inputMode
  inputMode.contextMenuItems = GraphItemTypes.NODE

  // In this demo, we use our sample context menu implementation but you can use any other context menu widget as
  // well. See the Context Menu demo for more details about working with context menus.
  const contextMenu = new ContextMenu(graphComponent)

  // Add event listeners to the various events that open the context menu. These listeners then
  // call the provided callback function which in turn asks the current ContextMenuInputMode if a
  // context menu should be shown at the current location.
  contextMenu.addOpeningEventListeners(graphComponent, location => {
    const worldLocation = graphComponent.toWorldFromPage(location)

    // Inform the input mode that a context menu should be opened.
    // Eventually, this will fire the events GraphEditorInputMode.PopulateItemContextMenu and
    // ContextMenuInputMode.PopulateMenu
    const showMenu = inputMode.contextMenuInputMode.shouldOpenMenu(worldLocation)

    // Check whether showing the context menu is permitted and if so show the menu
    if (showMenu) {
      contextMenu.show(location)
    }
  })

  // Add item-specific menu entries
  inputMode.addPopulateItemContextMenuListener((sender, args) => {
    contextMenu.clearItems()
    if (INode.isInstance(args.item)) {
      // The 'showMenu' property is set to true to inform the input mode that we actually want to show a context menu
      // for this item (or more generally, the location provided by the event args).
      // If you don't want to show a context menu for some locations, set 'false' in this cases.
      args.showMenu = true

      contextMenu.addMenuItem('Set to now', () => {
        dateMapper.set(args.item, new Date())
      })
    }
  })

  // Add a listener that closes the menu when the input mode requests this
  inputMode.contextMenuInputMode.addCloseMenuListener(() => {
    contextMenu.close()
  })

  // If the context menu closes itself, for example because a menu item was clicked, we must inform the input mode
  contextMenu.onClosedCallback = () => {
    inputMode.contextMenuInputMode.menuClosed()
  }
}

/**
 * Enables the Undo functionality.
 */
function enableUndo() {
  // Enables undo on the graph.
  graphComponent.graph.undoEngineEnabled = true
}

/**
 * Configures the default style for group nodes.
 */
function configureGroupNodeStyles() {
  const graph = graphComponent.graph

  // set the style, label and label parameter for group nodes
  graph.groupNodeDefaults.style = new GroupNodeStyle({
    tabFill: '#0b7189',
    tabPosition: 'left',
    contentAreaFill: '#9dc6d0'
  })

  // Sets a label style with left-aligned text
  graph.groupNodeDefaults.labels.style = new DefaultLabelStyle({
    horizontalTextAlignment: 'center',
    textFill: 'white'
  })

  // Places the label inside the tab area of the group node.
  // For the GroupNodeStyle, GroupNodeLabelModel is usually the most appropriate label model.
  graph.groupNodeDefaults.labels.layoutParameter =
    new GroupNodeLabelModel().createDefaultParameter()
}

/**
 * Configures basic interaction.
 * Interaction is handled by InputModes. {@link GraphEditorInputMode} is the main
 * InputMode that already provides a large number of graph interaction gestures, such as moving, deleting, creating,
 * resizing graph elements. Note that labels can be edited by pressing F2. Also, labels can be moved to different
 * locations determined by their label model.
 */
function configureInteraction() {
  // Creates a new GraphEditorInputMode instance and registers it as the main
  // input mode for the graphComponent
  graphComponent.inputMode = new GraphEditorInputMode({
    allowGroupingOperations: true
  })
}

/**
 * Sets up default label model parameters for graph elements.
 * Label model parameters control the actual label placement as well as the available
 * placement candidates when moving the label interactively.
 */
function setDefaultLabelLayoutParameters() {
  // For edge labels, the default is a label that is rotated to match the associated edge segment
  // We'll start by creating a model that is similar to the default:
  const edgeLabelModel = new EdgePathLabelModel({
    autoRotation: true,
    distance: 10,
    sideOfEdge: EdgeSides.LEFT_OF_EDGE | EdgeSides.RIGHT_OF_EDGE
  })
  // Finally, we can set this label model as the default for edge labels
  graphComponent.graph.edgeDefaults.labels.layoutParameter = edgeLabelModel.createDefaultParameter()
}

/**
 * Assigns default styles for graph elements.
 * Default styles apply only to elements created after the default style has been set,
 * so typically, you'd set these as early as possible in your application.
 */
function setDefaultStyles() {
  const graph = graphComponent.graph

  // Creates a nice ShapeNodeStyle instance, using an orange Fill.
  // Sets this style as the default for all nodes that don't have another
  // style assigned explicitly
  graph.nodeDefaults.style = new ShapeNodeStyle({
    shape: 'round-rectangle',
    fill: '#ff6c00',
    stroke: '1.5px #662b00'
  })

  // Sets the default size for nodes explicitly to 40x40
  graph.nodeDefaults.size = new Size(40, 40)

  // Creates a PolylineEdgeStyle which will be used as default for all edges
  // that don't have another style assigned explicitly
  graph.edgeDefaults.style = new PolylineEdgeStyle({
    stroke: '1.5px #662b00',
    targetArrow: '#662b00 small triangle'
  })

  // Creates a label style with the label font set to Tahoma and a black text color
  const defaultLabelStyle = new DefaultLabelStyle({
    font: '12px Tahoma',
    textFill: 'black'
  })

  // Sets the defined style as the default for both edge and node labels
  graph.edgeDefaults.labels.style = defaultLabelStyle
  graph.nodeDefaults.labels.style = defaultLabelStyle
}

/**
 * Updates the content rectangle to encompass all existing graph elements.
 * If you create your graph elements programmatically, the content rectangle
 * (i.e. the rectangle in __world coordinates__
 * that encloses the graph) is __not__ updated automatically to enclose these elements.
 * Typically, this manifests in wrong/missing scrollbars, incorrect {@link GraphOverviewComponent}
 * behavior and the like.
 *
 * This method demonstrates several ways to update the content rectangle, with or without adjusting the zoom level
 * to show the whole graph in the view.
 *
 * Note that updating the content rectangle only does not change the current viewport (i.e. the world coordinate
 * rectangle that corresponds to the currently visible area in view coordinates)
 *
 * Uncomment various combinations of lines in this method and observe the different effects.
 */
function updateViewport() {
  // Uncomment the following line to update the content rectangle
  // to include all graph elements
  // This should result in correct scrolling behaviour:

  // graphComponent.updateContentRect();

  // Additionally, we can also set the zoom level so that the
  // content rectangle fits exactly into the viewport area:
  // Uncomment this line in addition to UpdateContentRect:
  // Note that this changes the zoom level (i.e. the graph elements will look smaller)

  // graphComponent.fitContent();

  // The sequence above is equivalent to just calling:
  graphComponent.fitGraphBounds()
}

/**
 * Helper method that binds the various commands available in yFiles for HTML to the buttons
 * in the demo's toolbar.
 */
function registerCommands() {
  bindCommand("button[data-command='Open']", ICommand.OPEN, graphComponent)
  bindCommand("button[data-command='Save']", ICommand.SAVE, graphComponent)

  bindCommand("button[data-command='Cut']", ICommand.CUT, graphComponent)
  bindCommand("button[data-command='Copy']", ICommand.COPY, graphComponent)
  bindCommand("button[data-command='Paste']", ICommand.PASTE, graphComponent)

  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)

  bindCommand("button[data-command='Undo']", ICommand.UNDO, graphComponent)
  bindCommand("button[data-command='Redo']", ICommand.REDO, graphComponent)

  bindCommand("button[data-command='GroupSelection']", ICommand.GROUP_SELECTION, graphComponent)
  bindCommand("button[data-command='UngroupSelection']", ICommand.UNGROUP_SELECTION, graphComponent)

  // /////////////// New in this Sample /////////////////

  bindAction("button[data-command='Layout']", async () => runLayout())

  // ////////////////////////////////////////////////////
}

// noinspection JSIgnoredPromiseFromCall
run()
