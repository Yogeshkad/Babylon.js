module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class TouchCamera extends FreeCamera {
        private _offsetX: number = null;
        private _offsetY: number = null;
        private _pointerCount:number = 0;
        private _pointerPressed = [];
        private _attachedCanvas: HTMLCanvasElement;
        private _onPointerDown: (e: PointerEvent) => any;
        private _onPointerUp: (e: PointerEvent) => any;
        private _onPointerMove: (e: PointerEvent) => any;

        public angularSensibility: number = 200000.0;
        public moveSensibility: number = 500.0;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
        }

        public attachControl(canvas: HTMLCanvasElement, noPreventDefault: boolean): void {
            var previousPosition;

            if (this._attachedCanvas) {
                return;
            }
            this._attachedCanvas = canvas;

            if (this._onPointerDown === undefined) {

                this._onPointerDown = (evt) => {

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    this._pointerPressed.push(evt.pointerId);

                    if (this._pointerPressed.length !== 1) {
                        return;
                    }

                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                };

                this._onPointerUp = (evt) => {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    var index: number = this._pointerPressed.indexOf(evt.pointerId);

                    if (index === -1) {
                        return;
                    }
                    this._pointerPressed.splice(index, 1);

                    if (index != 0) {
                        return;
                    }
                    previousPosition = null;
                    this._offsetX = null;
                    this._offsetY = null;
                };

                this._onPointerMove = (evt) => {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    if (!previousPosition) {
                        return;
                    }

                    var index: number = this._pointerPressed.indexOf(evt.pointerId);

                    if (index != 0) {
                        return;
                    }

                    this._offsetX = evt.clientX - previousPosition.x;
                    this._offsetY = -(evt.clientY - previousPosition.y);
                };

                this._onLostFocus = () => {
                    this._offsetX = null;
                    this._offsetY = null;
                };
            }

            canvas.addEventListener("pointerdown", this._onPointerDown);
            canvas.addEventListener("pointerup", this._onPointerUp);
            canvas.addEventListener("pointerout", this._onPointerUp);
            canvas.addEventListener("pointermove", this._onPointerMove);

            Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public detachControl(canvas: HTMLCanvasElement): void {
            if (this._attachedCanvas != canvas) {
                return;
            }

            canvas.removeEventListener("pointerdown", this._onPointerDown);
            canvas.removeEventListener("pointerup", this._onPointerUp);
            canvas.removeEventListener("pointerout", this._onPointerUp);
            canvas.removeEventListener("pointermove", this._onPointerMove);

            Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);

            this._attachedCanvas = null;
        }

        public _checkInputs(): void {
            if (this._offsetX) {

                this.cameraRotation.y += this._offsetX / this.angularSensibility;

                if (this._pointerPressed.length > 1) {
                    this.cameraRotation.x += -this._offsetY / this.angularSensibility;
                } else {
                    var speed = this._computeLocalCameraSpeed();
                    var direction = new Vector3(0, 0, speed * this._offsetY / this.moveSensibility);

                    Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, 0, this._cameraRotationMatrix);
                    this.cameraDirection.addInPlace(Vector3.TransformCoordinates(direction, this._cameraRotationMatrix));
                }
            }

            super._checkInputs();
        }
    }
}