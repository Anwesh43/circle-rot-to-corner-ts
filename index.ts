const w : number = window.innerWidth 
const h : number = window.innerHeight
const parts : number = 4  
const scGap : number = 0.02 / parts 
const strokeFactor : number = 90 
const sizeFactor : number = 5.2 
const colors : Array<string> = ["#3F51B5", "#4CAF50", "#F44336", "#FFEB3B", "#009688"]
const delay : number = 20
const backColor : string = "#bdbdbd"

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