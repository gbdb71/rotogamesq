// The game.

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

/*jslint browser: true, maxerr: 50, maxlen: 79 */

/*global define */

define([
    'display', 'boards', 'load_indicator',
    'title', 'rotations_navigator', 'hiscores_table', 'boards_navigator',
    'util', 'vendor/rAF'
], function (
    display,
    boards,
    loadIndicator,
    title,
    rotationsNavigator,
    hiscoresTable,
    boardsNavigator,
    util
) {
    'use strict';

    var loaded = false,
        goldenRatio = 1.61803398875,
        width, // px
        height; // px

    // Updates GUI components for landscape layout.
    function updateComponentsLandscapeLayout(width, height) {
        // panel = panel with all the elements on the right of the board
        var panelWidth = width - height,
            panelLeft = height,
            panelInsideMargin = Math.floor(0.05 * panelWidth),
            panelInsideWidth = panelWidth - 2 * panelInsideMargin,
            panelInsideLeft = panelLeft + panelInsideMargin;

        display.layout = {
            sideLen: height,
            top: 0
        };
        title.layout = {
            width: panelWidth,
            left: panelLeft,
            height: Math.round(0.1 * height),
            textAlign: 'center'
        };
        boardsNavigator.layout = {
            width: panelInsideWidth,
            height: Math.round((width - height) / 4),
            left: panelInsideLeft,
            top: Math.round(0.99 * height - (width - height) / 4)
        };
        rotationsNavigator.layout = {
            width: panelInsideWidth,
            height: Math.round(0.1 * height),
            left: panelInsideLeft,
            top: Math.round(0.135 * height)
        };
        hiscoresTable.layout = {
            width: panelInsideWidth,
            height: Math.round(0.5 * height),
            left: panelInsideLeft,
            top: Math.round(0.28 * height)
        };
    }

    // Gives the game lanscape layout. The game is sized so that it takes up
    // the space of a golden ratio rectangle that takes up maximum space in the
    // browser window.
    function updateLandscapeLayout(viewportWidth, viewportHeight) {
        var viewportRatio = viewportWidth / viewportHeight,
            s = document.body.style;

        if (viewportRatio < goldenRatio) {
            width = viewportWidth;
            height = Math.floor(width / goldenRatio);
        } else {
            height = viewportHeight;
            width = Math.floor(height * goldenRatio);
        }

        s.width = width + 'px';
        s.height = height + 'px';

        // fixme: maybe introduce "landscape"

        if (loaded) {
            updateComponentsLandscapeLayout(width, height);
        }
    }

    // Updates components for portrait layout.
    function updateComponentsPortraitLayout(width, height) {
        var remainingHeight = height - width, // height without board display 
            componentHeight,
            componentTop;

        console.log('fixme: ', height, width);

        componentHeight = Math.round(remainingHeight * 0.18);
        title.layout = {
            width: width,
            left: 0,
            height: componentHeight,
            textAlign: 'left'
        };
        componentTop = componentHeight;
        componentHeight = width;
        display.layout = {
            sideLen: componentHeight,
            top: componentTop
        };
        componentTop += componentHeight;
        componentHeight = Math.round(height * 18 / 300);
        boardsNavigator.layout = {
            width: width,
            height: componentHeight,
            left: 0,
            top: componentTop
        };
        componentTop += componentHeight;
        componentHeight = Math.round(height * 18 / 300);
        rotationsNavigator.layout = {
            width: width,
            height: componentHeight,
            left: 0,
            top: componentTop
        };
        componentTop += componentHeight;
        componentHeight = Math.round(height * 18 / 300);
        hiscoresTable.layout = {
            width: width,
            height: componentHeight,
            left: 0,
            top: componentTop
        };
    }

    // Gives the game portrait layout. The game is sized so that it takes up
    // maximum space in the browser window. It's aspect ratio is set in limits:
    // between 3:4 and reciprocal golden ratio.
    function updatePortraitLayout(viewportWidth, viewportHeight) {
        var viewportRatio = viewportWidth / viewportHeight,
            s = document.body.style;

        width = viewportWidth;
        height = viewportHeight;

        // restricts aspect ratio:
        if (viewportRatio < 1 / goldenRatio) {
            // thinner than reciprocal golden ratio => restrict height
            height = Math.floor(width * goldenRatio);
            console.log('goldenRatio');
        } else if (viewportRatio > 3 / 4) {
            // wider than 3:4 => restrict width
            width = Math.floor(height * 3 / 4);
            console.log('3:4');
        }

        s.width = width + 'px';
        s.height = height + 'px';

        if (loaded) {
            updateComponentsPortraitLayout(width, height);
        }

        return; // fixme: do something
    }

    function updateLayout() {
        var viewportWidth = window.innerWidth,
            viewportHeight = window.innerHeight;

        if (viewportWidth > viewportHeight) {
            updateLandscapeLayout(viewportWidth, viewportHeight);
        } else {
            updatePortraitLayout(viewportWidth, viewportHeight);
        }

        loadIndicator.width = width;
    }

    function animStep() {
        if (loaded) {
            display.animStep();
            title.animStep();
            boardsNavigator.animStep();
            rotationsNavigator.animStep();
            hiscoresTable.animStep();
        } else {
            loadIndicator.animStep();
        }

        window.requestAnimationFrame(animStep);
    }

    function startAnim() {
        window.requestAnimationFrame(animStep);
    }

    function onResize() {
        updateLayout();
    }

    function onLoaded() {
        loaded = true;
        display.show();
        title.show();
        boardsNavigator.show();
        rotationsNavigator.show();
        hiscoresTable.show();
        loadIndicator.hide();
        updateLayout();
    }

    util.whenDocumentIsReady(function () {
        startAnim();
        boards.load(function () {
            onLoaded();
        });
        onResize(); // captures initial size
        window.addEventListener('resize', onResize);
    });
});
