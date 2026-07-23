(()=>{
  const normalize=s=>(s||'').toLowerCase().replace(/\s+/g,'').replace(/[、。・（）()／/\-－_「」『』：:！？!?]/g,'');

  function metricScenario(q,p){
    if(!(/mtbf|mttr|稼働率/.test(p))) return null;
    const metric=/mtbf/.test(p)?'mtbf':(/mttr/.test(p)?'mttr':'availability');
    const id=q.id||'';
    let scenario='';
    if(/^22a|^24/.test(id)) scenario='75-70_50-40';
    else if(/^22b|^23b/.test(id)) scenario='75-72_50-49';
    else if(/^23a/.test(id)) scenario='75-72_50-48';
    else scenario=normalize(q.prompt);
    return metric+'_'+scenario;
  }

  function key(q){
    const p=(q.prompt||'').toLowerCase().replace(/\s+/g,'');
    const metric=metricScenario(q,p); if(metric) return metric;
    if(/トランザクション/.test(p)&&((/問題が発生/.test(p)&&!/発生しなかった/.test(p))||/失敗した/.test(p))) return 'transaction_rollback';
    if(/トランザクション/.test(p)&&(/問題が発生しなかった|正常終了/.test(p))) return 'transaction_commit';
    if((/ロールバック/.test(p)||/トランザクション管理/.test(p))&&/性質/.test(p)) return 'acid_atomicity';
    if(/他テーブル/.test(p)&&/登録されていない|存在しない/.test(p)) return 'foreign_key';
    if(/必ず何か入れ|値を必ず/.test(p)) return 'not_null';
    if(/行を特定/.test(p)&&/複数カラム/.test(p)) return 'primary_key';
    if(/排他/.test(p)&&/並行/.test(p)) return 'exclusive_write_write';
    if((/プロジェクト期間/.test(p)&&/スケジュール/.test(p))||/スケジュール確認/.test(p)) return 'gantt';
    if(/作業の階層/.test(p)&&/担当|実施担当者/.test(p)) return 'wbs';
    if((/spof|単一故障点/.test(p))&&!/負荷分散装置a|active\/standby|構成で/.test(p)) return 'spof_general';
    if(/2重運用/.test(p)&&/必要/.test(p)&&!/不要|行わない|最小限/.test(p)) return 'soft_landing';
    if(/2重運用/.test(p)&&/不要|行わない|最小限/.test(p)) return 'hard_landing';
    if(/決まった周期|周期.*処理|タイミング.*処理/.test(p)) return 'job_scheduler';
    if((/正常に動作/.test(p)&&/確認/.test(p))||/異常検出/.test(p)) return 'monitoring';
    if(/要件定義/.test(p)&&/誰|主体|実施責任体制/.test(p)) return 'requirements_owner';
    if((/総合試験|運用試験|運用テスト/.test(p))&&/誰|主体/.test(p)) return 'system_test_owner';
    if(/webアプリ/.test(p)&&/開発/.test(p)&&/拡張|効率/.test(p)) return 'framework';
    if((/java/.test(p)&&/再利用/.test(p))||/他者が有用/.test(p)) return 'library';
    if(/結合テスト後/.test(p)&&/環境/.test(p)) return 'test_environment';
    if(/dbサーバ/.test(p)&&/並列化が難しい|単体で性能|台数を増やさず/.test(p)) return 'scale_up';
    if(/入出力が多い/.test(p)&&/拡張|性能/.test(p)) return 'scale_out';
    if(/重要なタイミング/.test(p)&&/変更できない/.test(p)) return 'milestone';
    if(/実施期間が長くなる|終了時期が延びる/.test(p)&&/工程/.test(p)) return 'cpm_concept';
    if(/共通.*ネットワーク図/.test(p)&&/クリティカルパス/.test(p)) return 'cpm_common_graph';
    if((/負荷分散装置a|active\/standby/.test(p))&&/spof|単一故障点/.test(p)) return 'web_architecture_spof';
    if((/全体.*信頼性|システム全体の信頼性/.test(p))&&/式/.test(p)&&/スタンバイe|eを計算から除外|eを除外/.test(p)) return 'web_architecture_formula';
    if(/webサーバ2台/.test(p)&&/どちらか/.test(p)&&/信頼性/.test(p)&&/式/.test(p)) return 'two_web_parallel_formula';
    if(/webサーバ1台/.test(p)&&/dbサーバ1台/.test(p)&&/信頼性/.test(p)&&/式/.test(p)) return 'web_db_series_formula';
    if(/1000×500/.test(p)&&/30枚/.test(p)&&/10mbyte\/s/.test(p)&&/0\.5/.test(p)) return 'bitmap_transfer_1000_500_30';
    return 'exact_'+normalize(q.prompt);
  }

  function richness(q){
    let n=(q.prompt||'').length+(q.explanation||'').length*0.15;
    if(/必要日数/.test(q.prompt||'')) n+=30;
    if(Array.isArray(q.options)) n+=q.options.length;
    return n;
  }

  const past=Q.filter(q=>q.category==='過去問');
  const groups=new Map();
  for(const q of past){
    const k=key(q);
    if(!groups.has(k)) groups.set(k,[]);
    groups.get(k).push(q);
  }

  const keep=[];
  for(const items of groups.values()){
    items.sort((a,b)=>richness(b)-richness(a));
    const q=items[0];
    const years=[...new Set(items.map(x=>((x.source||'').match(/20\d{2}/)||[])[0]).filter(Boolean))].sort();
    q.pastSources=items.map(x=>x.source).filter((v,i,a)=>v&&a.indexOf(v)===i);
    q.source='過去問まとめ（'+years.join('・')+'）';
    keep.push(q);
  }

  const other=Q.filter(q=>q.category!=='過去問');
  Q.splice(0,Q.length,...keep,...other);

  try{
    const p=document.querySelector('#past p.small');
    if(p) p.textContent='2022〜2025の過去問を1つにまとめ、同じ内容の問題は1問に統合している。';
  }catch(e){}

  window.renderPastCombined=()=>{
    const arr=Q.filter(q=>q.category==='過去問');
    if(window.pastQuestions) pastQuestions.innerHTML='<h3 style="margin-top:20px">2022〜2025 過去問まとめ（'+arr.length+'問）</h3>'+arr.map(q=>renderQuestion(q,'p-')).join('');
  };
  window.showPastCombined=window.renderPastCombined;

  try{
    if(window.examList){
      examList.innerHTML='<div class="card exam-btn" onclick="showPastCombined()"><strong>2022〜2025 過去問まとめ</strong><span class="small">'+keep.length+'問・重複削除済み</span></div>';
    }
    window.renderPastCombined();
  }catch(e){}

  try{
    if(typeof calcQs!=='undefined'){
      calcQs.splice(0,calcQs.length,...Q.filter(q=>q.type==='calc'));
      renderCalc();
    }
  }catch(e){}

  try{updateStats();renderPractice();}catch(e){}
})();