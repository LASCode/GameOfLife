import {valueInRange} from "../utils/valueInRange";

export class Drawer {
    rootNode!: HTMLDivElement;
    canvasNode!:  HTMLCanvasElement;

    canvasCtx!: CanvasRenderingContext2D;

    canvasMeshNode!:  HTMLCanvasElement;
    canvasRectsNode!:  HTMLCanvasElement;
    canvasServiceNode!:  HTMLCanvasElement;
    canvasMeshCtx!: CanvasRenderingContext2D;
    canvasRectsCtx!: CanvasRenderingContext2D;
    canvasServiceCtx!: CanvasRenderingContext2D;

    width!: number;
    height!: number;
    offSetX: number = 0;
    offSetY: number = 0;
    scale: number = 1;
    cellSize: number = 50;

    callbacks: Record<string, (...args: any[]) => void> = {};
    cursorPointCoords: [number | null, number | null] = [null, null];
    mouseMoveStartValues: [number, number] = [0, 0];
    mouseMovePrevValues: [number, number] = [0, 0];
    pause: boolean = true;
    speed: number = 200;
    timerInstance: NodeJS.Timer | null = null;


    elements: {x: number, y: number}[] = [];
    pressedKey: string | null = null;

    constructor() {}

    init(container: HTMLDivElement) {
        this.rootNode = container;
        this.width = container.getBoundingClientRect().width;
        this.height = container.getBoundingClientRect().height;

        this.canvasMeshNode = document.createElement('canvas');
        this.canvasMeshCtx = this.canvasMeshNode.getContext('2d') as CanvasRenderingContext2D;
        this.rootNode.appendChild(this.canvasMeshNode);

        this.canvasRectsNode = document.createElement('canvas');
        this.canvasRectsCtx = this.canvasRectsNode.getContext('2d') as CanvasRenderingContext2D;
        this.rootNode.appendChild(this.canvasRectsNode);


        this.initCallbacks();
        window.addEventListener('resize', this.callbacks._resize);
        window.addEventListener('keydown', this.callbacks._keydown);
        window.addEventListener('keyup', this.callbacks._keyup);
        this.rootNode.addEventListener('mousemove', this.callbacks._drawCursorMark);
        this.rootNode.addEventListener('wheel', this.callbacks._wheelScaling);
        this.rootNode.addEventListener('click', this.callbacks._cellClick);

        this._resize();
        this.redraw();
    }

    redraw() {
        this.redrawRects();
        this.redrawMesh();
        this.drawToolbar();
    }

    private drawLines() {
        const { xLength, yLength } = this.getXYLength();

        const fromX = +((this.offSetX / (this.cellSize * this.scale)) * -1).toFixed(0);
        const toX = fromX < 0 ? xLength + fromX : xLength + fromX;

        const fromY = +((this.offSetY / (this.cellSize * this.scale)) * -1).toFixed(0);
        const toY = fromY < 0 ? yLength + fromY : yLength + fromY;

        // for (let yi = fromY; yi < toY + 1; yi++) {
        //     for (let xi = fromX; xi < toX + 1; xi++) {
        //         this.canvasMeshCtx.beginPath()
        //         this.canvasMeshCtx.lineWidth = 1;
        //         this.canvasMeshCtx.strokeStyle = 'rgba(0,0,0,0.5)';
        //         this.canvasMeshCtx.moveTo(((this.cellSize * this.scale) * xi) - 0.5 + this.offSetX, 0);
        //         this.canvasMeshCtx.lineTo(((this.cellSize * this.scale) * xi) - 0.5 + this.offSetX, this.height);
        //         this.canvasMeshCtx.stroke();
        //
        //         this.canvasMeshCtx.beginPath()
        //         this.canvasMeshCtx.lineWidth = 1;
        //         this.canvasMeshCtx.strokeStyle = 'rgba(255,0,0,0.13)';
        //         this.canvasMeshCtx.moveTo(0, ((this.cellSize * this.scale) * yi) - 0.5 + this.offSetY);
        //         this.canvasMeshCtx.lineTo(this.width, ((this.cellSize * this.scale) * yi) - 0.5 + this.offSetY);
        //         this.canvasMeshCtx.stroke();
        //     }
        // }
        for (let xi = fromX; xi < toX + 1; xi++) {
            this.canvasMeshCtx.beginPath()
            this.canvasMeshCtx.lineWidth = 1;
            if (xi === 0) {
                this.canvasMeshCtx.strokeStyle = 'rgba(100,255,0,1)';
            } else {
                this.canvasMeshCtx.strokeStyle = (xi % 5 === 0) ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)';
            }
            this.canvasMeshCtx.moveTo(((this.cellSize * this.scale) * xi) - 0.5 + this.offSetX, 0);
            this.canvasMeshCtx.lineTo(((this.cellSize * this.scale) * xi) - 0.5 + this.offSetX, this.height);
            this.canvasMeshCtx.stroke();
        }

        for (let yi = fromY; yi < toY + 1; yi++) {
            this.canvasMeshCtx.beginPath()
            this.canvasMeshCtx.lineWidth = 1;
            if (yi === 0) {
                this.canvasMeshCtx.strokeStyle = 'rgba(100,255,0,1)';
            } else {
                this.canvasMeshCtx.strokeStyle = (yi % 5 === 0) ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)';
            }
            this.canvasMeshCtx.moveTo(0, ((this.cellSize * this.scale) * yi) - 0.5 + this.offSetY);
            this.canvasMeshCtx.lineTo(this.width, ((this.cellSize * this.scale) * yi) - 0.5 + this.offSetY);
            this.canvasMeshCtx.stroke();
        }



    }
    private drawElementsFromLocal() {
        this.elements.forEach((el) => {
            this.drawElementFromLocal(this.convertToGlobalCoords(el));
        })
    }
    private drawElementFromLocal({x: rawX, y: rawY}: {x: number, y: number}, options?: {color: string}) {
        const x = rawX + this.offSetX;
        const y = rawY + this.offSetY;
        const width = this.cellSize * this.scale;
        const height = this.cellSize * this.scale;

        this.canvasRectsCtx.beginPath()
        this.canvasRectsCtx.fillStyle = options?.color || "black";
        this.canvasRectsCtx.fillRect(x, y, width, height);
        this.canvasRectsCtx.stroke();
    }
    private getXYLength() {
        return ({
            xLength: this.width / (this.cellSize * this.scale),
            yLength: this.height / (this.cellSize * this.scale)
        })
    }


    /* callbacks */
    private initCallbacks() {
        this.callbacks._resize = this._resize.bind(this);
        this.callbacks._drawCursorMark = this._drawCursorMark.bind(this);
        this.callbacks._wheelScaling = this._wheelScaling.bind(this);
        this.callbacks._cellClick = this._cellClick.bind(this);
        this.callbacks._keydown = this._keydown.bind(this);
        this.callbacks._keyup = this._keyup.bind(this);

        this.callbacks._move_mouseDown = this._move_mouseDown.bind(this);
        this.callbacks._move_mouseUp = this._move_mouseUp.bind(this);
        this.callbacks._move_mouseMove = this._move_mouseMove.bind(this);

        this.callbacks._startGame = this._startGame.bind(this);
        this.callbacks._stopGame = this._stopGame.bind(this);
        this.callbacks._renderGameStep = this._renderGameStep.bind(this);
    }
    private _resize() {
        const { height, width } = this.getContainerSize();
        this.width = width;
        this.height = height;
        [this.canvasMeshNode, this.canvasRectsNode].forEach((el) => {
            el.height = height;
            el.width = width;
        })
        this.redraw();
    }
    private _drawCursorMark(event: MouseEvent) {
        if (this.pressedKey !== null) { return }
        const normalizedCoords = this.normalizeGlobalCoords({x: event.offsetX, y: event.offsetY});
        this.cursorPointCoords = [ normalizedCoords.x, normalizedCoords.y ];
        this.redrawRects();
    }
    private _wheelScaling(event: WheelEvent) {
        this.scale = valueInRange(0.01, 2, +(this.scale + ((event.deltaY * -1) / 5000)).toFixed(3))
        this.redraw();
    }
    private _cellClick(event: MouseEvent) {
        if (this.pressedKey) { return }
        const newRectCoords = this.convertToLocalCoords({ x: event.offsetX, y: event.offsetY });

        if (this.elements.find((el) => el.x === newRectCoords.x && el.y === newRectCoords.y)) {
            this.elements = this.elements.filter((el) => el.x !== newRectCoords.x || el.y !== newRectCoords.y)
        } else {
            this.elements.push(newRectCoords);
        }
    }
    private _keydown(event: KeyboardEvent) {
        if (this.pressedKey === event.code) { return }
        this.pressedKey = event.code;

        if (this.pressedKey === 'ShiftLeft') {
            this.rootNode.style.cursor = 'move';
            this.rootNode.addEventListener('mousedown', this.callbacks._move_mouseDown);
        }

        if (event.code === 'Space') {
            const func = this.pause ? this.callbacks._startGame : this.callbacks._stopGame;
            func();
        }
    }
    private _keyup() {
        this.pressedKey = null;

        this.rootNode.style.cursor = 'pointer';
        this.rootNode.removeEventListener('mousedown', this.callbacks._move_mouseDown);
    }
    private _move_mouseMove(event: MouseEvent) {

        const [startX, startY] = this.mouseMoveStartValues;
        const [prevX, prevY] = this.mouseMovePrevValues;

        const calculatedOffSetX = event.offsetX < 0 ? event.offsetX + startX : event.offsetX - startX;
        const calculatedOffSetY = event.offsetY < 0 ? event.offsetY + startY : event.offsetY - startY;

        this.offSetX = calculatedOffSetX + (this.offSetX - prevX);
        this.offSetY = calculatedOffSetY + (this.offSetY - prevY);

        this.mouseMovePrevValues = [calculatedOffSetX, calculatedOffSetY];
        this.redraw();
    }
    private _move_mouseDown(event: MouseEvent) {
        this.mouseMovePrevValues = [event.offsetX, event.offsetY];
        this.mouseMoveStartValues = [0, 0];
        this.rootNode.addEventListener('mousemove', this.callbacks._move_mouseMove);
        this.rootNode.addEventListener('mouseup', this.callbacks._move_mouseUp);
    }
    private _move_mouseUp() {
        this.mouseMovePrevValues = [0, 0];
        this.mouseMoveStartValues = [0, 0];
        this.rootNode.removeEventListener('mousemove', this.callbacks._move_mouseMove);
        this.rootNode.removeEventListener('mouseup', this.callbacks._move_mouseUp);
    }
    private _startGame() {
        console.log('### Gama started ###');
        this.pause = false;
        this.timerInstance = setInterval(this.callbacks._renderGameStep, this.speed);
    }
    private _stopGame() {
        console.log('### Gama paused ###');
        if (!this.timerInstance) { return }
        this.pause = true;
        clearInterval(this.timerInstance);
        this.timerInstance = null;
    }
    private _renderGameStep() {
        interface TestType {
            x: number;
            y: number;
            type: 'empty' | 'full';
            child: TestType[];
        }
        // this.elements.reduce<TestType[]>((acc, curr, i, arr) => {
        //     const { x, y } = curr;
        //     const child = arr.
        // }, [])


        const b = this.elements.reduce<{x: number, y: number, child: {x: number, y: number}[]}[]>((acc, curr, i, arr) => {
            acc.push(({
                x: curr.x,
                y: curr.y,
                child: arr.filter((el) => {
                    if (curr.x === el.x && curr.y === el.y) return false;

                    const x = curr.x + 1 === el.x || curr.x - 1 === el.x || curr.x === el.x;
                    const y = curr.y + 1 === el.y || curr.y - 1 === el.y || curr.y === el.y;

                    return x && y;
                })
            }))

            return acc;
        }, [])

        const getCellType = ({ x, y }: {x: number, y: number}) => {
            const result = this.elements.some((el) => el.x === x && el.y === y);
            return result ? 'black' : 'white';
        }
        const getCellChild = ({ x, y }: {x: number, y: number}) => {
            const matrix = [
                {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1},
                {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0},
                {x: -1, y: 1}, {x: 0, y: 1}, {x: 1, y: 1},
            ];
            return matrix.map((el) => ({x: x - el.x, y: y - el.y}))
        }
        const getCellKey = ({ x, y }: {x: number, y: number}) => {
            return `${x}_${y}`
        }

        type test = {x: number, y: number, type: 'white' | 'black'};
        const b1 = this.elements.reduce<Record<string, test>>((acc, curr, i, arr) => {
            getCellChild(curr).forEach((el) => {
                const key = getCellKey(el);
                if (!!acc[key]) { return; }
                acc[key] = { ...el, type: getCellType(el) }
            });

            return acc;
        }, {})

        this.elements = Object.entries(b1).reduce<{ x: number, y: number }[]>((acc, [key, data], i, arr) => {
            // const children = getCellChild(data)
            //     .filter((el) => !(el.x === data.x && el.y === data.y))
            //     .map((el) => ({...el, key: getCellKey(el)}))
            //
            // console.log(children);


            const children = getCellChild(data)
                .filter((el) => !(el.x === data.x && el.y === data.y))
                .map((el) => ({...el, key: getCellKey(el)}))
            const childCountByType = children.reduce((acc, curr) => {
                switch (getCellType(curr)) {
                    case "black": ++acc.black; break;
                    case "white": ++acc.white; break;
                }
                return acc;
            }, {black: 0, white: 0});

            switch (data.type) {
                case "black": {
                    if (childCountByType.black <= 3 && childCountByType.black >= 2) {
                        acc.push({x: data.x, y: data.y});
                    }
                } break;
                case "white": {
                    console.log(data.x, data.y, children)
                    if (childCountByType.black === 3) {
                        acc.push({x: data.x, y: data.y});
                    }
                } break;
            }

            return acc;
        }, [])


        // this.elements = Object.entries(b1).map(([key, data]) => ({x: data.x, y: data.y}))

        this.redrawRects();


        console.log(b1, this.elements);
    }


    /* utils */
    private convertToLocalCoords({ x: rawX, y: rawY }: {x: number, y: number}) {
        const cellSize = this.cellSize * this.scale;
        const xCoordsWithOffSet = rawX - this.offSetX;
        const yCoordsWithOffSet = rawY - this.offSetY;

        return ({
            x: Math.floor(xCoordsWithOffSet / cellSize),
            y: Math.floor(yCoordsWithOffSet / cellSize),
        })
    }
    private convertToGlobalCoords({ x: rawX, y: rawY }: {x: number, y: number}) {
        const cellSize = this.cellSize * this.scale;

        return ({
            x: Math.floor(rawX * cellSize),
            y: Math.floor(rawY * cellSize),
        })
    }
    private normalizeGlobalCoords({ x: rawX, y: rawY }: {x: number, y: number}) {
        return this.convertToGlobalCoords(this.convertToLocalCoords({x: rawX, y: rawY}))
    }
    private getContainerSize() {
        const { width, height } = this.rootNode.getBoundingClientRect();
        return ({ width, height });
    }
    private clearMesh() {
        this.canvasMeshCtx.clearRect(0, 0, this.width, this.height);
    }
    private clearRects() {
        this.canvasRectsCtx.clearRect(0, 0, this.width, this.height);
    }
    private redrawMesh() {
        this.clearMesh();
        this.drawLines();
    }
    private redrawRects() {
        this.clearRects();
        this.drawElementsFromLocal();

        const [ cursorPointX, cursorPointY ] = this.cursorPointCoords;

        if (cursorPointX !== null && cursorPointY !== null) {
            this.drawElementFromLocal({x: cursorPointX, y: cursorPointY}, {color: 'rgba(0,0,0,0.1)'})
        }

    }



    /* DRAWERS */
    private drawCellRelative(coords: RelativeCoords, params?: DrawRectParams): void {
        const x = coords.x + this.offSetX;
        const y = coords.y + this.offSetY;
        const width = this.cellSize * this.scale;
        const height = this.cellSize * this.scale;

        this.canvasRectsCtx.beginPath();
        this.canvasRectsCtx.fillStyle = params?.color || "black";
        this.canvasRectsCtx.fillRect(x, y, width, height);
        this.canvasRectsCtx.stroke();
    }
    private drawToolbar(): void {
        document.getElementById('test_123231')?.remove();
        const html = `
            <div id="test_123231" style="position: absolute; right: 0; top: 0; background: rgba(255, 255, 255, 0.1);">
                <div>offsetX: ${this.offSetX}</div>
                <div>offsetY: ${this.offSetY}</div>
                <div>scale: ${this.scale}</div>
            </div>
        `
        this.rootNode.insertAdjacentHTML('beforeend', html);
    }
}

interface DrawRectParams { color?: string }
interface RelativeCoords { x: number, y: number }
interface AbsoluteCoords { x: number, y: number }
