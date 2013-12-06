/* В этот файл помещать небольшиие вспомогательные функции */

function toMeters(pixels) {		// перевод из пикселей в метры
    return pixels / SCALE;
}

function toRadian(degrees) {  // перевод из градусов в радианы (в box2d угол в радианах)
    return degrees * Math.PI / 180;
}

function toDegrees(degrees) {  // перевод из радианы в градусов
    return degrees * 180 / Math.PI;
}