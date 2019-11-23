let ngrok = "https://085398a5.ngrok.io/classify"
async function coverImages(listOfImages, probList) {
    for (i in probList) {
        if (probList[i][0] > .5) {
            listOfImages[i].style.opacity = 1;
        } else {
            listOfImages[i].src = chrome.extension.getURL("kitty.jpg")
            listOfImages[i].style.opacity = 1;
        }
    }
}


async function isNFSW(listOfImages) {
    tempList = []
    for (item of listOfImages) if (item.src !== undefined) tempList.push(item)
    listOfImages = tempList
    console.log(listOfImages)
    for (item of listOfImages) {
        item.style.opacity = 0; 
    }
    let imgCounter = 0
    let blobs = []
    for (item of listOfImages) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', item.src, true);
        xhr.responseType = 'blob'
        xhr.onload = function(e) {
            if (this.status == 200) {
                var blob = new Blob([this.response], {type: 'image/png'});
                blobs.push(blob);
                imgCounter += 1
                //console.log(imgCounter, listOfImages.length)
                if (imgCounter == listOfImages.length) {
                    send_image(listOfImages, blobs);
                }
            }
        };
        xhr.send();
    }
}    


// // After the image is loaded into var blob, it can be send
// // to the server side
async function send_image(listOfImages, blobs) {
    // res = []
    // for (i in listOfImages) res.push([.1, .9])
    // coverImages(listOfImages, res);
    // return;
    var formData = new FormData();
    let count = 0
    for (blob of blobs) {
        formData.append(count, blob);
        count += 1
    }
    var request = new XMLHttpRequest();
    request.open("POST", ngrok);
    request.responseType = "json"//IDK
    request.onload = function(e) {
       coverImages(listOfImages, this.response)
    }
    request.send(formData);
}

function searchDOM (doc) {
    const srcChecker = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i
    return Array.from(doc.querySelectorAll('*'))
    .reduce((collection, node) => {
    // bg src
    let prop = window.getComputedStyle(node, null)
        .getPropertyValue('background-image')
    // match `url(...)`
    let match = srcChecker.exec(prop)
    if (match) {
        collection.add(node)
    }

    if (/^img$/i.test(node.tagName)) {
        collection.add(node)
    } else if (/^frame$/i.test(node.tagName)) {
        // iframe
        try {
        searchDOM(node.contentDocument || node.contentWindow.document)
            .forEach(img => {
            if (img) { collection.add(img) }
            })
        } catch (e) {}
    }
    return collection
    }, new Set())
}

search = Array.from(searchDOM(document))
query = []
for (i in search) {
    query.push(search[i])
    if (i % 15 == 0 || i == search.length-1) {
        isNFSW(query)
        query = []
    }
}

var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        var nodes = mutation.addedNodes;
        var node;
        for(var n = 0; node = nodes[n], n < nodes.length; n++) {
            if (node.tagName == "img") isNFSW([node])
            try{
                images = Array.from(searchDOM(node))
                isNFSW(images)
            } catch  {
                continue
            }
        };
    });
});
            
            var config = { attributes: false, childList: true, subtree: true, characterData: false};
            var target = document;
            
            observer.observe(target, config);
            // configuration of the observer:
            // pass in the target node, as well as the observer options
            
const FRAME_RATE = 30;

function injectTopBar() {
    const div = document.createElement("DIV");
    div.style.position="fixed";
    div.style.left=0;
    div.style.top=0;
    div.style.right=0;
    div.style.height="10px";
    div.style.zIndex = 10000;
    const indicator = document.createElement("CANVAS");
    indicator.width = 600;
    indicator.height = 20;
    indicator.style.margin = 0;
    indicator.style.width="100%";
    indicator.style.height="10px";
    indicator.style.left = 0;
    indicator.style.top = 0;
    indicator.id = "bar";
    div.appendChild(indicator);
    document.body.appendChild(div);
}
injectTopBar();

function injectFullScreenCover() {
    const div = document.createElement("DIV");
    div.style.position = "fixed";
    div.style.left = 0;
    div.style.right = 0;
    div.style.top = "10px";
    div.style.bottom = 0;
    div.style.zIndex = 9999;
    div.style.backgroundColor = "white";
    div.style.display = "none";
    div.id="fullScreenCover";

    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.flexDirection = "column";
    
    div.innerHTML = `
        <p style="font-size: 30px">This Content is Unsafe and has been Blocked</p>
        <canvas id="canvas" style="width:240px;height:180px;"></canvas>
        <p id="rating" style="font-size: 20px"></p>
        <br>
    `
    
    document.body.appendChild(div);
}
injectFullScreenCover();


function disableFullScreenCover() {
    document.getElementById("fullScreenCover").dataset.disabled = true;
    hideFullScreenCover();
}

function updateCover(video) {
    document.getElementById("fullScreenCover").style.width = video.style.width;
    document.getElementById("fullScreenCover").style.height = video.style.height;
    document.getElementById("fullScreenCover").style.left = video.getBoundingClientRect().x.toString() + "px";
    document.getElementById("fullScreenCover").style.top = video.getBoundingClientRect().y.toString() + "px";
}

function showFullScreenCover(video){
    if(document.getElementById("fullScreenCover").dataset.disabled) return;
    document.getElementById("fullScreenCover").style.display = "flex"
}

function hideFullScreenCover() {
    document.getElementById("fullScreenCover").style.display = "none";
}



class VideoAnalyzer {
    constructor(videoElem) {
        this.video = videoElem; //TODO: clone video off screen instead
        this.shadow = this.video;
        this.shadow.muted = true;
        this.seen = new Set()

        this.canvas = document.createElement("canvas");
        this.canvas.width = 480;
        this.canvas.height = 360;
        this.ctx = this.canvas.getContext("2d");
        this.canvas2 = document.getElementById("canvas");
        this.canvas2.width = 480;
        this.canvas2.height = 360;
        this.ctx2 = this.canvas2.getContext("2d");
        this.canvas3 = document.createElement("canvas");
        this.canvas3.width = 480;
        this.canvas3.height = 360;
        this.ctx3 = this.canvas3.getContext("2d");
        //this.indicatorCtx = document.getElementById("indicator").getContext("2d");

        this.barCanvas = document.getElementById("bar");
        this.barCtx = this.barCanvas.getContext("2d");

        this.video.addEventListener("seeked", () => this.handleSeek());
        this.video.addEventListener("play", () => this.handleSeek());
        this.counter = 0;
        this.ratings = [];
        this.canToggleCover = true;
        this.toggleCoverTimeout = null;
        this.video.play();
        console.log("done initialization");
    }

    handleSeek() {
        if(this.shadow !== this.video)
            this.shadow.currentTime = this.video.currentTime;
        if(this.shadow.paused || this.shadow.ended) {
            this.startAnalysis();
        }
    }

    playVideo() {
        this.video.play();
    }

    getShadowFrame() {
        this.ctx.drawImage(this.shadow, 0, 0, 480, 360);
        return this.canvas.toDataURL();
    }

    startAnalysis() {
        this.shadow.play();
        this.timerCallback();
    }

    stopAnalysis() {
        this.shadow.pause();
    }

    showBar() {
        const barWidth = 600 / this.shadow.duration;
        for(let i = 0; i < this.shadow.duration; i++){
            let color = "blue";
            if(this.ratings[i] > .3) {
                color = "green";
            }else{
                if(this.ratings[i] < .31){
                    color = "red";
                }
            }

            this.barCtx.fillStyle = color;
            this.barCtx.fillRect(barWidth * i, 0, barWidth, 20);
        }
        this.barCtx.fillStyle = "black";
        this.barCtx.fillRect(this.video.currentTime * barWidth, 0, 2, 20);
    }

    setRating(second, prob) {

        this.ratings[second] = prob
        console.log(this.ratings)
    }

    timerCallback () {
        if (this.shadow.ended) return
        updateCover(this.video)
        this.counter++;
        const src = this.getShadowFrame();
        const shadowSecond = Math.floor(this.shadow.currentTime) + 3;
        const videoSecond = Math.floor(this.video.currentTime)
        let global = this
        if(!(this.seen.has(shadowSecond))) {
            this.seen.add(shadowSecond)
            console.log(this.seen)
            var xhr = new XMLHttpRequest();
            xhr.open('GET', src, true);
            xhr.responseType = 'blob'
            xhr.onload = function(e) {
                if (this.status == 200) {
                    var blob = new Blob([this.response], {type: 'image/png'})
                    var formData = new FormData();
                    formData.append('0', blob);
                    
                    var request = new XMLHttpRequest();
                    request.open("POST", ngrok);
                    request.responseType = "json"//IDK
                    request.onload = function(e) {
                        global.setRating(shadowSecond, this.response[0][0]);
                    }
                    request.send(formData);
                    
                }
            };
            xhr.send();
        }
        if (this.ratings[videoSecond] !== undefined && this.ratings[videoSecond] < .3) showFullScreenCover(this.video);
        
        else hideFullScreenCover();


        this.showBar();

        setTimeout(() => {
            this.timerCallback()
        }, 100);
    }
}




const videoCheck = setInterval(() => {
    const video = document.querySelector("video");
    if(video !== null) {
        clearInterval(videoCheck);
        va = new VideoAnalyzer(video);
        va.startAnalysis();
    }else{
        console.log("video not found");
    }
}, 1000);