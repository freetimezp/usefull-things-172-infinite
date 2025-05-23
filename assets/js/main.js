document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".container");
    const scroller = document.querySelector(".scroller");
    const progressCounter = document.querySelector(".progress-counter h1");
    const progressBar = document.querySelector(".progress-bar");
    const sections = Array.from(scroller.querySelectorAll("section"));

    const smoothFactor = 0.05;
    const touchSensitivity = 2.5;
    const bufferSize = 2;

    let targetScrollX = 0;
    let currentScrollX = 0;
    let isAnimating = false;
    let currentProgressScale = 0;
    let targetProgressScale = 0;
    let lastPercentage = 0;

    let isDown = false;
    let lastTouchX = 0;
    let tocuhVelocity = 0;
    let lastTouchTime = 0;

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const setupScroll = () => {
        scroller.querySelectorAll(".clone-section").forEach((clone) => clone.remove());

        const originalSections = Array.from(scroller.querySelectorAll("section:not(.clone-section)"));
        const templateSections = originalSections.length > 0 ? originalSections : sections;

        let sequenceWidth = 0;
        templateSections.forEach((section) => {
            sequenceWidth += parseFloat(window.getComputedStyle(section).width);
        });

        for(let i = -bufferSize; i < 0; i++) {
            templateSections.forEach((section, index) => {
                const clone = section.cloneNode(true);
                clone.classList.add("clone-section");
                clone.setAttribute("data-clone-index", `${i}-${index}`);
                scroller.appendChild(clone);
            });
        }

        if(originalSections.length === 0) {
            templateSections.forEach((section, index) => {
                const clone = section.cloneNode(true);
                clone.setAttribute("data-clone-index", `0-${index}`);
                scroller.appendChild(clone);
            });
        }

        for(let i = 0; i <= bufferSize; i++) {
            templateSections.forEach((section, index) => {
                const clone = section.cloneNode(true);
                clone.classList.add("clone-section");
                clone.setAttribute("data-clone-index", `${i}-${index}`);
                scroller.appendChild(clone);
            });
        }


        scroller.style.width = `${sequenceWidth * (1 + bufferSize * 2)}px`;
        targetScrollX = sequenceWidth * bufferSize;
        currentScrollX = targetScrollX;
        scroller.style.transform = `translateX(-${currentScrollX}px)`;

        return sequenceWidth;
    };


    const checkBoundaryAndReset = (sequenceWidth) => {
        if(currentScrollX > sequenceWidth * (bufferSize + 0.5)) {
            targetScrollX -= sequenceWidth;
            currentScrollX -= sequenceWidth;
            scroller.style.transform = `translateX(-${currentScrollX}px)`; 

            return true;
        }

        if(currentScrollX < sequenceWidth * (bufferSize - 0.5)) {
            targetScrollX += sequenceWidth;
            currentScrollX += sequenceWidth;
            scroller.style.transform = `translateX(-${currentScrollX}px)`; 

            return true;
        }

        return false;
    };


    const updateProgress = (sequenceWidth, forceReset = false) => {
        const basePosition = sequenceWidth * bufferSize;
        const currentPosition = (currentScrollX - basePosition) % sequenceWidth;
        let percentage = (currentPosition / sequenceWidth) * 100;

        if(percentage < 0) {
            percentage = 100 + percentage;
        }

        const isWrapping = 
            (lastPercentage > 80 && percentage < 20) ||
            (lastPercentage < 20 && percentage > 80) ||
            forceReset;
        
        
        progressCounter.textContent = `${Math.round(percentage)}`;
        targetProgressScale = percentage / 100;

        if(isWrapping) {
            currentProgressScale = targetProgressScale;
            progressBar.style.transform = `scaleX(${currentProgressScale})`;
        }

        lastPercentage = percentage;
    };


    const animate = (sequenceWidth, forceProgressReset = false) => {
        currentScrollX = lerp(currentScrollX, targetScrollX, smoothFactor);
        scroller.style.transform = `translateX(-${currentScrollX}px)`;

        updateProgress(sequenceWidth, forceProgressReset);

        if(!forceProgressReset) {
            currentProgressScale = lerp(currentProgressScale, targetProgressScale, smoothFactor);
            progressBar.style.transform = `scaleX(${currentProgressScale})`;
        }

        if(Math.abs(targetScrollX - currentScrollX) < 0.01) {
            isAnimating = false;
        } else {
            requestAnimationFrame(() => animate(sequenceWidth));
        }
    };


    const sequenceWidth = setupScroll();
    updateProgress(sequenceWidth, true);
    progressBar.style.transform = `scaleX(${currentProgressScale})`;

    container.addEventListener("wheel", (e) => {
        e.preventDefault();
        targetScrollX += e.deltaY;

        const needsReset = checkBoundaryAndReset(sequenceWidth);

        if(!isAnimating) {
            isAnimating = true;

            requestAnimationFrame(() => animate(sequenceWidth, needsReset));
        }
    }, { passive: false });


    container.addEventListener("touchstart", (e) => {
        isDown = true;
        lastTouchX = e.touches[0].clientX;
        lastTouchTime = Date.now();
        targetScrollX = currentScrollX;
    });

    container.addEventListener("touchmove", (e) => {
        if(!isDown) return;
        e.preventDefault();

        const currentTouchX = e.touches[0].clientX;
        const tocuhDelta = lastTouchX - currentTouchX;

        targetScrollX += tocuhDelta * touchSensitivity;

        const currentTime = Date.now();
        const timeDelta = currentTime - lastTouchTime;
        if(timeDelta > 0) {
            tocuhVelocity = (tocuhDelta / timeDelta) * 15;
        }

        lastTouchX = currentTouchX;
        lastTouchTime = currentTime;

        const needsReset = checkBoundaryAndReset(sequenceWidth);
        if(!isAnimating) {
            isAnimating = true;
            requestAnimationFrame(() => animate(sequenceWidth, needsReset));
        }
    });


    container.addEventListener("touchend", () => {
        isDown = false;

        if(Math.abs(tocuhVelocity) > 0.1) {
            targetScrollX += tocuhVelocity * 20;

            const decayVelocity = () => {
                tocuhVelocity *= 0.95;

                if(Math.abs(tocuhVelocity) > 0.1) {
                    targetScrollX += tocuhVelocity;
                    const needsReset = checkBoundaryAndReset(sequenceWidth);

                    if(needsReset) {
                        updateProgress(sequenceWidth, true);
                    }

                    requestAnimationFrame(decayVelocity);
                }
            };

            requestAnimationFrame(decayVelocity);
        }
    });
});
























