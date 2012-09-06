// Panel that shows information such as the game's name.

// Copyright 2012 Felix E. Klee <felix.klee@inka.de>
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

/*jslint browser: true, devel: true, maxerr: 50, maxlen: 79 */

/*global define */

define(['boards', 'boards_navigator'], function (boards, boardsNavigator) {
    'use strict';

    var width, height, selectedBoard, isVisible = false;

    function el() {
        return document.getElementById('panel');
    }

    function updateDimensions(e, newWidth, newHeight) {
        var style = e.style,
            newPadding = Math.round(0.01 * newWidth);

        style.padding = newPadding + 'px';
        style.width = (newWidth - 2 * newPadding) + 'px';
        style.height = (newHeight - 2 * newPadding) + 'px';
        style.left = newHeight + 'px';
        style.fontSize = Math.ceil(newHeight / 25) + 'px';

        width = newWidth;
        height = newHeight;
    }

    function needsToBeRerendered(newWidth, newHeight) {
        return (width !== newWidth || height !== newHeight ||
                selectedBoard !== boards.selectedBoard);
    }

    function render(newWidth, newHeight) {
        var e;

        if (isVisible && needsToBeRerendered(newWidth, newHeight)) {
            e = el();

            updateDimensions(e, newWidth, newHeight);
            boardsNavigator.render(newWidth);

            selectedBoard = boards.selectedBoard;
        }
    }

    function show() {
        el().style.display = 'block';
        isVisible = true;
    }

    return {
        render: render,
        show: show
    };
});
