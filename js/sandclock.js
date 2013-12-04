// параметры часов
var x_clock = 300;	// координаты часов
var y_clock = 300;
var box_height = 150;	// параметры чашек
var box_width = 200;
var d = 50;				// диаметр отверстия
var H = 130;			// высота спуска

var PI = Math.PI;

function setClock() {
    var box_height_m = toMeters(box_height);
    var box_width_m = toMeters(box_width);


    // снизу
    addPoly(x_clock, y_clock + H / 2 + box_height, [
        [-0.1, box_width_m / 2],
        [-0.1, -box_width_m / 2],
        [0.1, -box_width_m / 2],
        [0.1, box_width_m / 2]
    ], PI / 2, true);	// низ
    addPoly(x_clock - box_width / 2, y_clock + H / 2 + box_height / 2, [
        [-0.1, box_height_m / 2],
        [-0.1, -box_height_m / 2],
        [0.1, -box_height_m / 2],
        [0.1, box_height_m / 2]
    ], 0, true);	// бок левый
    addPoly(x_clock + box_width / 2, y_clock + H / 2 + box_height / 2, [
        [-0.1, box_height_m / 2],
        [-0.1, -box_height_m / 2],
        [0.1, -box_height_m / 2],
        [0.1, box_height_m / 2]
    ], 0, true);	// бок правый

    // сверху
    addPoly(x_clock, y_clock - H / 2 - box_height, [
        [-0.1, box_width_m / 2],
        [-0.1, -box_width_m / 2],
        [0.1, -box_width_m / 2],
        [0.1, box_width_m / 2]
    ], PI / 2, true);	// низ
    addPoly(x_clock - box_width / 2, y_clock - H / 2 - box_height / 2, [
        [-0.1, box_height_m / 2],
        [-0.1, -box_height_m / 2],
        [0.1, -box_height_m / 2],
        [0.1, box_height_m / 2]
    ], 0, true);	// бок левый
    addPoly(x_clock + box_width / 2, y_clock - H / 2 - box_height / 2, [
        [-0.1, box_height_m / 2],
        [-0.1, -box_height_m / 2],
        [0.1, -box_height_m / 2],
        [0.1, box_height_m / 2]
    ], 0, true);	// бок правый

    //  стенки
    var L = toMeters(Math.sqrt(H * H / 4 + (box_width / 2 - d / 2) * (box_width / 2 - d / 2)));
    var alpha = Math.atan((box_width - d) / H);
    addPoly(x_clock - box_width / 4 - d / 4, y_clock + H / 4, [
        [-0.1, L / 2],
        [-0.1, -L / 2],
        [0.1, -L / 2],
        [0.1, L / 2]
    ], alpha, true);	// бок левый нижний
    addPoly(x_clock + box_width / 4 + d / 4, y_clock + H / 4, [
        [-0.1, L / 2],
        [-0.1, -L / 2],
        [0.1, -L / 2],
        [0.1, L / 2]
    ], PI - alpha, true);	// бок правый нижний
    addPoly(x_clock - box_width / 4 - d / 4, y_clock - H / 4, [
        [-0.1, L / 2],
        [-0.1, -L / 2],
        [0.1, -L / 2],
        [0.1, L / 2]
    ], PI - alpha, true);	// бок левый верхний
    addPoly(x_clock + box_width / 4 + d / 4, y_clock - H / 4, [
        [-0.1, L / 2],
        [-0.1, -L / 2],
        [0.1, -L / 2],
        [0.1, L / 2]
    ], alpha, true);	// бок правый верхний
}

function createSand() {
    var r = 3;
    for (i = 0; i < 100; i++) {
        createBall(x_clock - box_width / 2 + 10 + (2 * r * (i % 30)), y_clock - H / 2 - box_height + 15 + 2 * r * i / 30, r);
    }
}