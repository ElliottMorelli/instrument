//import * as Tone from 'tone';

//const { Tone } = require("tone/build/esm/core/Tone");

//const { Tone } = require("tone/build/esm/core/Tone");

//const { Tone } = require("tone/build/esm/core/Tone");

//const { Tone } = require("tone/build/esm/core/Tone");

//const { Oscillator } = require("tone");

document.addEventListener("DOMContentLoaded", function(event) { 
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioCtx = new AudioContext();

    var startTime;
    var rhythmIndex;
    var loopLength;
    var biquadFilter;
    var biquadFilter2;

    var noiseNoteLength = "8n";

    const globalGain = new Tone.Gain(0.75).toDestination();

    const riffOne = document.getElementById('riff1');
    const crunchBeat = document.getElementById('crunch');
    const bassBeat = document.getElementById('bassbeat');
    const arpeggio = document.getElementById('arpeggio');
    const chords = document.getElementById('chords');
    const noiseBeat = document.getElementById('noisebeat');

    var running = false;

    const chordMap = {
        "A": ["A4","C#4","E4","A5"],
        "Am": ["A4","C4","E4","A5"],
        "B":["B4","D#4","F#4","B5"],
        "Bm":["B4","D4","F#4","B5"],
        "C":["C4","E4","G4","C5"],
        "Cm":["C4","Eb4","G4","C5"],
        "D":["D4","F#4","A4","D5"],
        "Dm":["D4","F4","A4","D5"],
        "E":["E4","G4","B4","E5"],
        "Em":["E4","Gb4","B4","E5"],
        "F":["F4","A4","C4","F5"],
        "Fm":["F4","Ab4","C4","F5"],
        "G":["G4","B4","C4","G5"],
        "Gm":["G4","Bb4","C4","G5"],
        "Ab":["Ab4","C4","Eb4","Ab5"],
        "Abm":["Ab4","B4","Eb4","Ab5"],
        "Bb":["Bb4","D4","F4","Bb5"],
        "Bbm":["Bb4","Db4","F4","Bb5"],
        "Db":["Eb4","G4","Bb4","Eb5"],
        "Dbm":["Eb4","Gb4","Bb4","Eb5"],
        "Gb":["Gb4","Bb4","C#4","Gb5"],
        "Gbm":["Gb4","A4","C#4","Gb5"]
    }

    const keyMap = {
        "Cm": ["Cm","D","Fm","Gm"],
        "Dm": ["Dm","E","F","Gm","Am"],
        "Em": ["Em","G","Am","Bm","C"],
        "Fm": ["Fm","G","Ab","Bbm","Cm"],
        "Am": ["Am","B","C","Dm","Em"],
        "Bm": ["Bm","Db","Em","Gbm","G"],
        "C": ["C","Dm","Em","F","G","Am"],
        "C#": ["Db","Fm","Bm"],
        "D": ["D","Em","G","A","Bm"],
        "E": ["E","Gbm","Abm","A","B"],
        "F": ["F","Gm","Am","Bb","C","Dm"],
        "F#": ["Gb","Abm","Bbm","Db","F"],
        "G": ["G","Am","Bm","C","D","Em","Gb"],
        "Ab": ["Ab","Bbm","Cm","Db","F","Gm"],
        "A": ["A","Bm","Dbm","D","E","Gbm"],
        "Bb":["Bb","Cm","Dm","F","Gm","A"],
        "B":["B","Dbm","E","Gb","Abm"]
        
    }

    
    
    let effects = [
        {
          "id": 0,
          "name": "crunch",
          "selected": false,
          "element": crunchBeat
        },
        {
            "id": 1,
            "name": "bass",
            "selected": false
          
        },
        {
            "id": 2,
            "name": "riff1",
            "selected": false,
            "element": riffOne
        },
        {
            "id": 3,
            "name": "riff2",
            "selected": false,
            "element": null
        },
        {
            "id": 4,
            "name": "bassbeat",
            "selected": false,
            "element": bassBeat
        },
        {
            "id": 5,
            "name": "arpeggio",
            "selected": false,
            "element": arpeggio
        },
        {
            "id": 6,
            "name": "chords",
            "selected": false,
            "element": chords
        },
        {
            "id": 7,
            "name": "noisebeat",
            "selected": false,
            "element": noiseBeat
        }
      ]
    

    var timerWorker = null;

    noiseBeat.addEventListener('click',function(){
        updateEffectsList(7);
    })
    chords.addEventListener('click',function(){
        updateEffectsList(6);
    })
    arpeggio.addEventListener('click', function(){ 
        updateEffectsList(5);
    })
    riffOne.addEventListener('click', function() {   
        updateEffectsList(2);
    });

    crunchBeat.addEventListener('click', function() {   
        updateEffectsList(0);
    });

    bassBeat.addEventListener('click',function() {
        updateEffectsList(4);
    });
 
    function updateEffectsList(index){
        if(effects[index].selected == false){
            effects[index].selected = true;
            effects[index].element.style.backgroundColor =  "lightblue";

        } else {
            effects[index].selected = false;
            effects[index].element.style.backgroundColor =  "lightgrey";
        }

        if(running == false){
            initEffects();
        }
        checkRunning();

    }

    var sequence = 0;

    var keyInput = "C";

    var upDown = false;

    function getChord(key){
        var arr = keyMap[key];
        if(sequence > arr.length-1){
            sequence = 0;
        }
        var chord = chordMap[arr[sequence]];
        return chord;

    }

    const synth = new Tone.Synth();
    const pluck = new Tone.PluckSynth();
    const autoWah = new Tone.AutoWah(50, 6, -30);

    const arpGainNode = new Tone.Gain(0.75);

    autoWah.connect(arpGainNode);
    synth.connect(arpGainNode);
    pluck.connect(arpGainNode);

    arpGainNode.connect(globalGain);
    const poly = new Tone.PolySynth();
    const polyGain = new Tone.Gain(0.75);

    poly.connect(polyGain);
    polyGain.connect(globalGain);

    function initKeyChords(key,noteTime){
        var offset = parseFloat(setNoteLength("chordpos"));
        //console.log("offset:" + offset);
        chord = getChord(key);
        poly.set({ detune: -1200 });
        poly.triggerAttackRelease(chord,0.5,noteTime+offset);
    }

    var highnote = false;
    const highNoteCheck = document.getElementById('highnote');
    const upDownRad = document.getElementById('updown');

    function setNoteLength(name){
       
            var notelength = document.getElementsByName(name); 
              
            for(i = 0; i < notelength.length; i++) { 
                if(notelength[i].checked) 
                return notelength[i].value; 
            } 
        
    }

    var noteLength = "16n";
    const wahChecked = document.getElementById('wahwah');
    var Wahconnected = false;

    function initKeyArp(key,noteTime){

        highnote = highNoteCheck.checked;
        upDown = upDownRad.checked;
        chord = getChord(key);
        wahwah = wahChecked.checked;
        
        //wahwah toggle
        if(wahwah == true){
            autoWah.Q.value = 6;
            synth.connect(autoWah);
            Wahconnected = true;
        } else if(Wahconnected == true){
            autoWah.Q.value = 0;
            synth.disconnect(autoWah);
            Wahconnected = false;
        }

        const now = noteTime;
        var offset = 0.0;
        var increment = 0.125;
        var repeat = 4;

        //changing the note length changes the amount of loops

        if(noteLength == "8n"){
            increment = 0.25;
            repeat = 2;
        } 
        if(noteLength == "4n"){
            increment = 0.5;
            repeat = 1;
        } 
       

        for(var j = 0; j < repeat; j++){  
            if(upDown == true){
                if(j % 2 == 0){
                    //Arp up
                    for(var i = 0; i < chord.length; i++){
                        var note = ""+chord[i];
                        //console.log(note);
                        var note_octave = note.replace("4", "3");
            
                        if(highnote == false){
                            note_octave = note.replace("5", "4");
                        }
                        pluck.triggerAttack(note,now+offset);
                        synth.triggerAttackRelease(note_octave, noteLength, now+offset);
                        offset = offset + increment;
                        
                    }

                } else {

                    //this is Arp down
                    for(var i = chord.length-1; i >= 0; i--){
                        var note = ""+chord[i];
                        //console.log(note);
                        var note_octave = note.replace("4", "3");
                        if(highnote == false){
                            note_octave = note.replace("5", "4");
                        }
                        pluck.triggerAttack(note,now+offset);
                        synth.triggerAttackRelease(note_octave, "16n", now+offset);
                        offset = offset + increment;
                    }

                }
            } else {

                for(var i = 0; i < chord.length; i++){
                    var note = ""+chord[i];
                    //console.log(note);
                    var note_octave = note.replace("4", "3");
        
                    if(highnote == false){
                        note_octave = note.replace("5", "4");
                    }
                    pluck.triggerAttack(note,now+offset);
                    synth.triggerAttackRelease(note_octave, noteLength, now+offset);
                    offset = offset + increment;
                    
                }

            }
                
        }            

    }

    const effectsGainNode = new Tone.Gain(0.75);
    effectsGainNode.connect(globalGain);

    const polynomial = document.getElementById('polynomial');
    polynomial.addEventListener('click',function(){
        updateGains();
        const cheby = new Tone.Chebyshev(40);
        const synth = new Tone.MonoSynth().connect(cheby);
        cheby.connect(effectsGainNode);
        synth.triggerAttackRelease("C2", 0.4);
    })

    const wobble = document.getElementById('wobble');
    wobble.addEventListener('click',function(){
        updateGains();
        const wob = new Tone.AMSynth();

        const rev = new Tone.Reverb(20);

        const vibrato = new Tone.Vibrato(10);
        vibrato.connect(effectsGainNode);
        //rev.connect(effectsGainNode);

        wob.connect(rev);
        rev.connect(vibrato);
        wob.triggerAttackRelease("C3", "2n");

    })

    const landing = document.getElementById('landing');
    landing.addEventListener('click', function(){
        updateGains();
        const fatOsc = new Tone.FatOscillator("Ab3", "sawtooth", 40);
        fatOsc.connect(effectsGainNode);
        fatOsc.start("+0.2");
        fatOsc.frequency.rampTo("D2", 2);
        fatOsc.stop("+2.0");

    })


    const duoSynth = new Tone.DuoSynth();

    const riff1GainNode = new Tone.Gain(0.75);
    duoSynth.connect(riff1GainNode);
    riff1GainNode.connect(globalGain);


    function changeOctave(chord,newOctave){

        var newChord = [];

        for(var i = 0; i < chord.length; i++){
            var note = ""+chord[i];
            var newNote = note.replace("4",newOctave);
            newChord.push(newNote);

        }
        return newChord;
    }


    function initRiff1(key,noteTime){
            chord = getChord(key);
            const now = noteTime;
            newChord = changeOctave(chord,"2");
            //console.log("newchord" + newChord);
            //newChord = chord;

            duoSynth.triggerAttackRelease(newChord[1], "16n",now);
            duoSynth.triggerAttackRelease(newChord[1], "16n",now+0.25);
            duoSynth.triggerAttackRelease(newChord[0], "16n",now+0.75);

    }

    const webaudioGlobalGain = audioCtx.createGain();
    webaudioGlobalGain.gain.setValueAtTime(0.75,audioCtx.currentTime);
    webaudioGlobalGain.connect(audioCtx.destination);

    const crunchGainNode = audioCtx.createGain();
    crunchGainNode.connect(webaudioGlobalGain);
    crunchGainNode.gain.setValueAtTime(0.75, audioCtx.currentTime);
    
    


    function initCrunch(noteTime) {

        var offset = parseFloat(setNoteLength("crunchpos"));

        var bufferSize = 0.5 * audioCtx.sampleRate,
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
        output = noiseBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 6 - 1;
        }
        whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        whiteNoise2 = audioCtx.createBufferSource();
        whiteNoise2.buffer = noiseBuffer;
    
        whiteNoise.start(noteTime+offset);

        biquadFilter = audioCtx.createBiquadFilter();
    
        biquadFilter.type = "lowpass";
        biquadFilter.frequency.setValueAtTime(600, audioCtx.currentTime);
        biquadFilter.gain.setValueAtTime(25, noteTime);
        biquadFilter.gain.exponentialRampToValueAtTime(.0001, noteTime+offset+0.125);
        whiteNoise.stop(noteTime+offset+0.125);
    
        whiteNoise.connect(biquadFilter).connect(crunchGainNode);

        whiteNoise2.start(noteTime + offset+0.25);

        biquadFilter2 = audioCtx.createBiquadFilter();
    
        biquadFilter2.type = "lowpass";
        biquadFilter2.frequency.setValueAtTime(300, audioCtx.currentTime);
        biquadFilter2.gain.setValueAtTime(30, noteTime+0.25);
        biquadFilter2.gain.exponentialRampToValueAtTime(.0001, noteTime+offset+offset+0.25);
        whiteNoise2.stop(noteTime+offset+0.50);
    
        whiteNoise2.connect(biquadFilter).connect(biquadFilter2).connect(crunchGainNode);
        
    
    }


    function initEffects(){
        running = true;
        handlePlay();
        var timerWorkerBlob = new Blob([
            "var timeoutID=0;function schedule(){timeoutID=setTimeout(function(){postMessage('schedule'); schedule();},100);} onmessage = function(e) { if (e.data == 'start') { if (!timeoutID) schedule();} else if (e.data == 'stop') {if (timeoutID) clearTimeout(timeoutID); timeoutID=0;};}"]);
    
        // Obtain a blob URL reference to our worker 'file'.
        var timerWorkerBlobURL = window.URL.createObjectURL(timerWorkerBlob);
    
        timerWorker = new Worker(timerWorkerBlobURL);
        timerWorker.onmessage = function(e) {
          schedule();
        };
        // Start the worker.
        timerWorker.postMessage('start');        
    }


    const bassGainNode = new Tone.Gain(0.75);

    var bassBeatComplexity = false;

    const fmOsc = new Tone.FMOscillator("B1");
    const fmOsc2 = new Tone.FMOscillator("G1");
    const fmOsc3 = new Tone.FMOscillator("A1");

    fmOsc.connect(bassGainNode);
    fmOsc2.connect(bassGainNode);
    fmOsc3.connect(bassGainNode);

    bassGainNode.connect(globalGain);

    function initBassBeat(noteTime){
        const now = noteTime;
        var increment = 0.25;

        bassBeatComplexity = document.getElementById('basscomplexity').checked;

        fmOsc.start(now);

        if(bassBeatComplexity == true){
            fmOsc2.start(now+increment);
            fmOsc2.stop(now+increment+0.25);
            fmOsc3.start(now+increment+(increment)+(0.125));
            fmOsc3.stop(now+increment+increment+increment);
        }
        
        // pitch the modulator an octave below carrier
        fmOsc.frequency.rampTo("E2",0.25);
        //fmOsc.harmonicity.value = harmVal;

        fmOsc.stop(now+0.5);

    }
    const noiseSynth = new Tone.NoiseSynth();
    const noiseGainNode = new Tone.Gain(0.75);

    noiseSynth.connect(noiseGainNode);
    noiseGainNode.connect(globalGain);

    function initNoiseBeat(noteTime){
        //console.log("in noise beat");
        var offset = 0.0;
        var increment = 0.25;
        var repeat = 4;
        const now = noteTime;

        if(noiseNoteLength == "4n"){
            repeat = 1;
            increment = 0.25;
        }
        if(noiseNoteLength == "16n"){
            repeat = 8;
            increment = 0.125;
        }

        for(var i = 0; i < repeat; i++){
            noiseSynth.triggerAttackRelease(noiseNoteLength, now+offset);
            offset = offset + increment;
        }
        
    }

    var globalGainSlider = document.getElementById('globalGain');
    var polyGainSlider = document.getElementById('chordGain');
    var arpGainSlider = document.getElementById('arpGain');
    var riff1GainSlider = document.getElementById('riff1Gain');
    var noiseGainSlider = document.getElementById('noiseGain');
    var bassGainSlider = document.getElementById('bassGain');
    var crunchGainSlider = document.getElementById('crunchGain');
    var effectsGainSlider = document.getElementById('effectsGain');

    function updateGains(){
        //console.log("gain is" + calculateGain(globalGainSlider.value));
        var mainGain = calculateGain(globalGainSlider.value);
        var chordGain = calculateGain(polyGainSlider.value);
        var arpGain = calculateGain(arpGainSlider.value);
        var riff1Gain = calculateGain(riff1GainSlider.value);
        var noiseGain = calculateGain(noiseGainSlider.value);
        var bassGain = calculateGain(bassGainSlider.value);
        var crunchGain = calculateGain(crunchGainSlider.value);
        var effectsGain = calculateGain(effectsGainSlider.value);

        crunchGainNode.gain.setValueAtTime(crunchGain, audioCtx.currentTime);
        webaudioGlobalGain.gain.setValueAtTime(mainGain, audioCtx.currentTime);

        //console.log("effects gain is:" + effectsGain);
        effectsGainNode.gain.rampTo(effectsGain,0.01);
        arpGainNode.gain.rampTo(arpGain,0.01);
        riff1GainNode.gain.rampTo(riff1Gain,0.01);
        noiseGainNode.gain.rampTo(noiseGain,0.01);
        bassGainNode.gain.rampTo(bassGain,0.01);
        polyGain.gain.rampTo(chordGain,0.01);
        globalGain.gain.rampTo(mainGain, 0.1);

    }
    
    function calculateGain(gain){
        var newGain = gain/100.0;
        return Math.round(newGain * 100) / 100
    }

    var cycle = 0;

    function schedule() {

        //console.log("in schedule");
        var currentTime = audioCtx.currentTime;
    
        // The sequence starts at startTime, so normalize currentTime so that it's 0 at the start of the sequence.
        currentTime -= startTime;

        if(cycle == 2){
            cycle = 0;
        }
        
        while (noteTime < currentTime + 0.120) {

            updateGains();

            noteLength = setNoteLength("notelength");
            noiseNoteLength = setNoteLength("noisenotelength");

            var contextPlayTime = noteTime + startTime;

            if(effects[0].selected == true){
                initCrunch(contextPlayTime);
                //initNoiseBeat(contextPlayTime);
            }

            if(effects[2].selected == true && cycle == 0){
                checkKey();
                initRiff1(keyInput,contextPlayTime);
            }

            if(effects[4].selected == true){
                initBassBeat(contextPlayTime);
            }
            //console.log(cycle);

            if((effects[5].selected == true) && cycle == 0){
                checkKey();
                //console.log(keyInput);
                initKeyArp(keyInput,contextPlayTime);   
            }

            if(effects[6].selected == true && cycle == 0){
                checkKey();
                initKeyChords(keyInput,contextPlayTime);
            }

            if(effects[7].selected == true){
                initNoiseBeat(contextPlayTime);
            }
            
            
            advanceNote();
        }
    }

    function checkKey(){
        var key = document.getElementById("keyInput").value;
        if(key){
            if(keyMap[key] != undefined){
                //console.log("checking worked?");
                keyInput = key;
            }
            
        } else {
            keyInput = "C";
        }

    }

    var tempo = 1.0;

    var tempoChange = document.getElementById('tempo');

    tempoChange.addEventListener('change', function() { 
        //console.log("tempo input");
        tempo = parseFloat((100/this.value));
        //console.log(tempo);

    }); 

    function checkRunning(){
        isRunning = false;
        for(var i = 0; i < effects.length; i++){
            if(effects[i].selected == true){
                isRunning = true;
            }
        }
        if(isRunning == false){
            timerWorker.postMessage("stop");
            running = false;
        }
        
    }

    function handleStop(){
        for(var i = 0; i < effects.length; i++){
            if(effects[i].selected == true){
                running = true;
                updateEffectsList(i);
            }
        }
        timerWorker.postMessage("stop");
        running = false;

    }

    const stop = document.getElementById('stop');
    stop.addEventListener('click', function(){
        handleStop();
    });


    
    function advanceNote() {
        rhythmIndex++;
        if (rhythmIndex == loopLength) {
            rhythmIndex = 0;
        }
        noteTime= noteTime + tempo;
        sequence++;
        cycle++;
    }

    function handlePlay(event) {
        noteTime = 0.0;
        startTime = audioCtx.currentTime + 0.005;
    }

});