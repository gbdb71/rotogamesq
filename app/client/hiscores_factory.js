// Creates lists of top players, associated with a certain board.

/*jslint browser: true, maxlen: 80 */

/*global define */

define([
    "ws_connection", "local_storage"
], function (wsConnection, localStorage) {
    "use strict";

    var isBetterOrEqual, saveProposal, listenToUpdates, requestHiscores,
        create,
        updateUnsavedHiscores, updateFromLocalStorage, updateLocalStorage,
        sendUnsavedToServer,
        lastNameSet = ''; // last name edited (preset for new proposals)

    isBetterOrEqual = function (hiscore1, hiscore2) {
        return (hiscore1 !== undefined &&
                (hiscore2 === undefined ||
                 hiscore1.nRotations <= hiscore2.nRotations));
    };

    updateFromLocalStorage = function (internal) {
        var data = localStorage.get(internal.localStorageKey);
        if (data && data.unsaved && data.saved) {
            internal.unsavedHiscores = data.unsaved;
            internal.savedHiscores = data.saved;
        } // else: no valid data available
    };

    // Atomically stores saved and unsaved hiscores.
    updateLocalStorage = function (internal) {
        localStorage.set(internal.localStorageKey, {
            unsaved: internal.unsavedHiscores,
            saved: internal.savedHiscores
        });
    };

    // via WebSocket (will automatically retry on broken connection)
    sendUnsavedToServer = function (internal) {
        internal.unsavedHiscores.forEach(function (unsavedHiscore) {
            wsConnection.emit({
                eventName: "hiscore for " + internal.boardName,
                eventData: unsavedHiscore
            });
        });
    };

    // Triggers saving of new hiscores entry:
    //
    //   * Puts in list of unsaved hiscores.
    //
    //   * Updates hiscores in localStorage.
    //
    //   * Sends unsaved hiscores to server (via WebSocket), for saving.
    saveProposal = function (internal) {
        var comparer = function (a, b) {
            return a.nRotations - b.nRotations;
        };

        if (internal.proposal !== undefined) {
            internal.unsavedHiscores.push(internal.proposal);

            // Unsaved hiscores are simply sorted by score, i.e. not also by
            // time (which isn't available anyhow):
            internal.unsavedHiscores.sort(comparer);

            updateLocalStorage(internal);

            sendUnsavedToServer(internal);

            internal.proposalWasSaved = true;

            internal.proposal = undefined; // or else it would still appear
        }
    };

    // Updates list of unsaved hiscores, removing entries where the name is
    // also in the list of saved hiscores and with an equal or better score.
    updateUnsavedHiscores = function (internal) {
        internal.savedHiscores.forEach(function (savedHiscore) {
            var unsavedHiscores = internal.unsavedHiscores, i = 0,
                unsavedHiscore;

            while (i < unsavedHiscores.length) {
                unsavedHiscore = unsavedHiscores[i];
                if (savedHiscore.name === unsavedHiscore.name &&
                        savedHiscore.nRotations <= unsavedHiscore.nRotations) {
                    unsavedHiscores.splice(i, 1);
                } else {
                    i += 1;
                }
            }
        });
    };

    listenToUpdates = function (internal) {
        wsConnection.addListener({
            eventName: "hiscores for " + internal.boardName,
            callback: function (newSavedHiscores) {
                internal.savedHiscores = newSavedHiscores;
                updateUnsavedHiscores(internal);
                updateLocalStorage(internal);
                internal.version += 1;
            }
        });
    };

    requestHiscores = function (internal) {
        wsConnection.emit({
            eventName: "request of hiscores for " + internal.boardName
        });
    };

    create = function (boardName) {
        var internal = {
            proposal: undefined, // new, proposed hiscore (editable)
            version: 0, // incremented on every update
            savedHiscores: [],
            unsavedHiscores: [], // new hiscores, not yet on the server
            boardName: boardName,
            localStorageKey: boardName + '.hiscores',
            hiscoreHasBeenSaved: false
        };

        updateFromLocalStorage(internal);
        sendUnsavedToServer(internal); // in case when the app was closed, and
                                       // data hadn't been sent to server

        listenToUpdates(internal);

        wsConnection.addOnOpenCallback(function () {
            requestHiscores(internal);
        });

        return Object.create(null, {
            // Calls callback with three parameters: hiscore, index, and
            // status. Status is one of:
            //
            //   * 'saved'
            //
            //   * 'unsaved'
            //
            //   * 'editable' (appears no more than once)
            //
            // Priorities if equal number of rotations from new to old:
            // editable -> unsaved -> editable
            //
            // Returns every name only once, with best score. The editable name
            // is viewed as different from all other names, as it's yet unknown
            // what the user will enter.
            forEach: {value: function (callback) {
                var i = 0, savedI = 0, unsavedI = 0, hiscore, status,
                    savedHiscore, unsavedHiscore,
                    savedHiscores = internal.savedHiscores,
                    unsavedHiscores = internal.unsavedHiscores,
                    proposal = internal.proposal,
                    proposalWasShown = false,
                    usedNames = [];

                while (i < 7) {
                    savedHiscore = savedHiscores[savedI];
                    unsavedHiscore = unsavedHiscores[unsavedI];
                    if (!proposalWasShown &&
                            isBetterOrEqual(proposal, unsavedHiscore) &&
                            isBetterOrEqual(proposal, savedHiscore)) {
                        hiscore = proposal;
                        status = 'editable';
                        proposalWasShown = true;
                    } else if (isBetterOrEqual(unsavedHiscore, savedHiscore)) {
                        hiscore = unsavedHiscore;
                        status = 'unsaved';
                        unsavedI += 1;
                    } else if (savedHiscore !== undefined) {
                        hiscore = savedHiscore;
                        status = 'saved';
                        savedI += 1;
                    } else {
                        break; // no more hiscores
                    }

                    if (status === 'editable') {
                        callback(hiscore, i, status);
                        i += 1;
                    } else if (usedNames.indexOf(hiscore.name) < 0) {
                        callback(hiscore, i, status);
                        usedNames.push(hiscore.name);
                        i += 1;
                    } // else: duplicate name
                }
            }},

            length: {get: function () {
                return Math.min((internal.savedHiscores.length +
                                 internal.unsavedHiscores.length +
                                 (internal.proposal !== undefined ? 1 : 0)),
                                7);
            }},

            hasProposal: {get: function () {
                return internal.proposal !== undefined;
            }},

            maxNameLen: {get: function () {
                return 8;
            }},

            nameInProposal: {set: function (name) {
                if (internal.proposal !== undefined) {
                    name = name.trim().substring(0, this.maxNameLen);
                    internal.proposal.name = name;
                    lastNameSet = name;
                }
            }},

            saveProposal: {value: function () {
                saveProposal.call(this, internal);
            }},

            proposalWasSaved: {get: function () {
                return internal.proposalWasSaved;
            }},

            // proposes a new hiscore (name is to be entered by the player)
            propose: {value: function (rotations) {
                internal.proposal = {
                    name: lastNameSet,
                    rotations: rotations.slice(),
                    nRotations: rotations.length
                };
            }},

            rmProposal: {value: function () {
                internal.proposal = undefined;
            }},

            resetProposal: {value: function () {
                internal.proposal = undefined;
                internal.proposalWasSaved = false;
            }},

            version: {get: function () {
                return internal.version;
            }}
        });
    };

    return Object.create(null, {
        create: {value: create}
    });
});
