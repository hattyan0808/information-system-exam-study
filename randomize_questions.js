(()=>{
  function shuffle(array){
    for(let i=array.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [array[i],array[j]]=[array[j],array[i]];
    }
    return array;
  }
  if(Array.isArray(window.Q)||typeof Q!=='undefined'){
    shuffle(Q);
    try{renderPractice();}catch(e){}
    try{renderCalc();}catch(e){}
    try{renderDrill();}catch(e){}
    try{updateStats();}catch(e){}
  }
})();
