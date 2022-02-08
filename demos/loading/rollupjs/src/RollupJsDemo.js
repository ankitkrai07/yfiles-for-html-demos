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
  GraphComponent,
  GraphEditorInputMode,
  LayoutExecutorAsync,
  License,
  Rect,
  ShapeNodeStyle
} from 'yfiles'
import license from './license.json'
import { enableWorkarounds } from './utils/Workarounds'
import LayoutWorker from './LayoutWorker.js'

const layoutWorker = new LayoutWorker()

License.value = license

enableWorkarounds()

// Create a GraphComponent and enable interactive editing
const graphComponent = new GraphComponent('graphComponent')
const graph = graphComponent.graph
graphComponent.inputMode = new GraphEditorInputMode()

// Set the default node style for new nodes
graph.nodeDefaults.style = new ShapeNodeStyle({
  fill: 'orange',
  stroke: 'orange',
  shape: 'rectangle'
})

// Create small sample graph
initializeGraph(graph)
registerCommands()

// Enable undo and center the graph in the view
graph.undoEngineEnabled = true
graphComponent.fitGraphBounds()

function initializeGraph(graph) {
  const node1 = graph.createNode(new Rect(50, 50, 30, 30))
  const node2 = graph.createNode(new Rect(0, 150, 30, 30))
  const node3 = graph.createNode(new Rect(100, 150, 30, 30))
  graph.createEdge(node1, node2)
  graph.createEdge(node1, node3)
}

function registerCommands() {
  document.querySelector("button[data-command='Layout']").addEventListener('click', runLayout)
}

/**
 * Runs a layout in a web worker
 */
function runLayout() {
  // helper function that performs the actual message passing to the web worker
  function webWorkerMessageHandler(data) {
    return new Promise(resolve => {
      layoutWorker.onmessage = e => resolve(e.data)
      layoutWorker.postMessage(data)
    })
  }

  // create an asynchronous layout executor that calculates a layout on the worker
  const executor = new LayoutExecutorAsync({
    messageHandler: webWorkerMessageHandler,
    graphComponent,
    duration: '1s',
    easedAnimation: true,
    animateViewport: true
  })

  return executor.start()
}
