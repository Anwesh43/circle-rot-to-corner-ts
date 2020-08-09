const w : number = window.innerWidth 
const h : number = window.innerHeight
const parts : number = 4  
const scGap : number = 0.02 / parts 
const strokeFactor : number = 90 
const sizeFactor : number = 5.2 
const colors : Array<string> = ["#3F51B5", "#4CAF50", "#F44336", "#FFEB3B", "#009688"]
const delay : number = 20
const backColor : string = "#bdbdbd"
const rot : number = Math.PI / 4 
const rFactor : number = 12.8
const circles = 4

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n 
    } 
    
    static sinify(scale : number) : number  {
        return Math.sin(scale * Math.PI)
    }
}

class DrawingUtil {
    
    static drawCircle(context : CanvasRenderingContext2D, x : number, y : number, size : number) {
        context.beginPath()
        context.arc(x, y, size, 0, 2 * Math.PI)
        context.fill()
    }

    static drawCircleRotSquare(context : CanvasRenderingContext2D, scale : number) {
        const sf : number = ScaleUtil.sinify(scale)
        const sf1 : number = ScaleUtil.divideScale(sf, 0, parts + 1)
        const sf2 : number = ScaleUtil.divideScale(sf, 1, parts + 1)
        const sf3 : number = ScaleUtil.divideScale(sf, 2, parts + 1)
        const sf4 : number = ScaleUtil.divideScale(sf, 3, parts + 1)
        const size : number = Math.min(w, h) / sizeFactor 
        const r : number = Math.min(w, h) / rFactor
        const dynSize : number = size * sf1 
        context.save()
        context.translate(w / 2, h / 2)
        context.rotate(rot * sf4)
        context.strokeRect(-dynSize, -dynSize, dynSize * 2, dynSize * 2)
        for (var j = 0; j < 4; j++) {
            DrawingUtil.drawCircle(context, size * sf3, size * sf3,r * sf2)
        }
        context.restore()
    }

    static drawCRSNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        context.strokeStyle = colors[i]
        context.fillStyle = colors[i]
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor 
        DrawingUtil.drawCircleRotSquare(context, scale)
    }
}

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D 
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w 
        this.canvas.height = h 
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0
    prevScale : number = 0
    dir : number = 0

    update(cb : Function) {
        this.scale += scGap * this.dir 
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir 
            this.dir = 0
            this.prevScale = this.scale 
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale 
            cb()
        }
    }
}

class Animator {

    animated : boolean = false 
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true 
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false 
            clearInterval(this.interval)
        }
    }
}

class CRSNode {

    state : State = new State()
    prev : CRSNode 
    next : CRSNode 

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < colors.length - 1) {
            this.next = new CRSNode(this.i + 1)
            this.next.prev = this 
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawCRSNode(context, this.i, this.state.scale)
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : CRSNode {
        var curr : CRSNode = this.prev 
        if (dir == 1) {
            curr = this.next 
        }
        if (curr) {
            return curr 
        }
        cb()
        return this 
    }
}

class CircleRotSquare {
    curr : CRSNode = new CRSNode(0)
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    crs : CircleRotSquare = new CircleRotSquare()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.crs.draw(context)
    }

    handleTap(cb : Function) {
        this.crs.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.crs.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}