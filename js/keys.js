
/* Класс контроллера нажатия клавиш.
 Позволяет проверять активированна ли некоторая комбинация клавиш. */
function KeysController () {
    var self = {};

    modifierCodes = [];
    for (modName in MODIFIERS) {
        modifierCodes.push(KEYS[modName]);
        console.log(modName, KEYS[modName]);
    }

    var modifiers = 0;
    var key = null;

    function getModifiers (event) {
        return (event.shiftKey * MODIFIERS.SHIFT) ^
            (event.ctrlKey * MODIFIERS.CONTROL) ^
            (event.altKey * MODIFIERS.ALT);
    }

    self.keyPressed = function (event) {
        modifiers = getModifiers(event);
        if (!(itemInArray(event.which, modifierCodes))) {
            key = event.which;
        }
    }

    self.keyUp = function (event) {
        modifiers = getModifiers(event);
        if (!(itemInArray(event.which, modifierCodes))) {
            key = null;
        }
    }

    /* Проверить комбинацию клавиш.
        @param combination массив из двух элементов: биты модификаторов и код клавиши.
            Отсутствие модификатора - 0, отсутствие клавиши - null.
            Пример: combination = [MODIFIERS.CONTROL | MODIFIERS.SHIFT, KEYS.N]*/
    self.isActive = function (combination) {
        return modifiers === combination[0] && key === combination[1];
    }

    return self;
}