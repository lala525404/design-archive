# 가이드 캡처 다시 만들기: npm run build && npx vite preview --port 4190 실행 후 python3 scripts/capture-guide.py
import asyncio, json, urllib.parse
from playwright.async_api import async_playwright
BASE='http://localhost:4190/'
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'public','guide')+'/'
DATA={}
IT_KEY="2026/02_아이티뱅크/261014_27410_it 스타터 과정_산돌-게티-ai_양현보"
SAEK_FOLDER="2026/05_평생/260120_15832_색채학 과정_산돌-AI_김다은"
SAEK_KEY="2026/05_평생/260120_15832_색채학 과정_산돌-ai_김다은"

async def box(pg, sel):
    loc=pg.locator(sel+' >> visible=true').first
    await loc.wait_for(state='visible', timeout=8000)
    return await loc.bounding_box()

async def shot(pg, name, clip, pins, viewport=False):
    # dx=='top' → 요소 위쪽 가운데에 표시
    """clip: selector | dict(x,y,width,height) in page coords (full page) ; pins: list of (selector, dx, dy)"""
    if isinstance(clip, str):
        b=await box(pg, clip); pad=16
        clip={'x':max(0,b['x']-pad),'y':max(0,b['y']-pad),'width':b['width']+pad*2,'height':b['height']+pad*2}
    # page coords: add scroll
    sy=await pg.evaluate('scrollY'); sx=await pg.evaluate('scrollX')
    if viewport:
        page_clip=clip
    else:
        page_clip=dict(clip)
    res=[]
    for sel,dx,dy in pins:
        b=await box(pg, sel)
        if dx=='top':
            x=b['x']+b['width']/2; y=b['y']-16
        else:
            x=b['x']+2; y=b['y']+2
        res.append({'x':round((x-page_clip['x'])/page_clip['width']*100,2),'y':round((y-page_clip['y'])/page_clip['height']*100,2)})
    await pg.mouse.move(-10,-10) if not name.startswith('u-newver') else None
    await pg.screenshot(path=OUT+name+'.jpg', clip=page_clip, type='jpeg', quality=80)
    DATA[name]={'w':round(page_clip['width']),'h':round(page_clip['height']),'pins':res}
    print(name, res)

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={'width':1280,'height':1700}, device_scale_factor=1.5)
        pg=await ctx.new_page()
        await pg.goto(BASE); await pg.wait_for_timeout(800)

        # ── 업로더 ──
        await pg.goto(BASE+'#/naming'); await pg.wait_for_timeout(500)
        card='.rule-card >> nth=0'
        await pg.locator(card).scroll_into_view_if_needed()
        await shot(pg,'u-naming',card,[(card+' >> .rule-pattern',0.05,0.5),(card+' >> .builder',0.03,0.25),(card+' >> .built-name .btn',0.5,0.5)])

        await pg.goto(BASE); await pg.wait_for_timeout(500)
        await pg.click('.hero-pill--primary'); await pg.wait_for_timeout(400)
        await pg.click('text=샘플 패키지 넣기'); await pg.wait_for_timeout(300)
        await pg.evaluate('scrollTo(0,0)')
        b1=await box(pg,'.page-title, main h1'); b2=await box(pg,'.wizard-footer')
        clip={'x':b2['x']-20,'y':b1['y']-10,'width':b2['width']+40,'height':b2['y']+b2['height']-b1['y']+30}
        await shot(pg,'u-upload',clip,[('.picked-add >> nth=0',0.5,0.5),('.quick-path input',0.08,0.5),('.wizard-footer .btn-primary',0.5,0.5)])

        await pg.click('.wizard-footer .btn-primary'); await pg.wait_for_timeout(1500)
        await pg.evaluate('scrollTo(0,0)')
        b1=await box(pg,'.review-block >> nth=0'); b2=await box(pg,'.review-files >> li >> nth=1')
        clip={'x':b1['x']-16,'y':b1['y']-50,'width':b1['width']+32,'height':b2['y']+b2['height']-b1['y']+70}
        await shot(pg,'u-review',clip,[('.review-block >> nth=0 >> input >> nth=0',0.1,0.5),('.review-block >> nth=1 >> .pkg-contents-chips',0.05,0.5),('.review-files >> li >> nth=0 >> .tile-version',0.5,0.5)])

        await pg.locator('.review-block.is-needed').scroll_into_view_if_needed()
        await pg.evaluate("document.querySelector('.review-block.is-needed').scrollIntoView({block:'start'})"); await pg.evaluate('scrollBy(0,-20)')
        await pg.wait_for_timeout(300)
        await pg.click('.builder-chips >> text=기타'); await pg.fill('.etc-resource input','언스플래시 이미지'); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('.review-block.is-needed').scrollIntoView({block:'start'})"); await pg.evaluate('scrollBy(0,-20)')
        await pg.wait_for_timeout(300)
        fb=await box(pg,'.review-footer'); rb=await box(pg,'.review-block.is-needed')
        clip={'x':rb['x']-16,'y':rb['y']-10,'width':rb['width']+32,'height':fb['y']+fb['height']-rb['y']+10}
        sy=await pg.evaluate('scrollY')
        clip_page={'x':clip['x'],'y':clip['y']+sy,'width':clip['width'],'height':clip['height']}
        # pins measured in viewport coords; convert by using page clip with viewport boxes + sy
        res=[]
        for sel,dx,dy in [('.reason-chips button >> nth=0',0.5,0.5),('.license-check',0.03,0.5),('.etc-row .proof-add',0.5,0.5),('.review-checklist',0.02,0.5),('.review-footer .btn-primary',0.5,0.5)]:
            bb=await box(pg,sel); x=bb['x']+2; y=bb['y']+2
            res.append({'x':round((x-clip['x'])/clip['width']*100,2),'y':round((y-clip['y'])/clip['height']*100,2)})
        await pg.screenshot(path=OUT+'u-review2.jpg', clip=clip, type='jpeg', quality=80)
        DATA['u-review2']={'w':round(clip['width']),'h':round(clip['height']),'pins':res}; print('u-review2',res)

        await pg.goto(BASE+'#/project?key='+urllib.parse.quote(IT_KEY)); await pg.wait_for_timeout(700)
        sec='.project-section >> nth=0'
        await pg.locator(sec).scroll_into_view_if_needed(); await pg.evaluate("document.querySelector('.project-section').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(300)
        await pg.hover('.project-file >> nth=0 >> .project-file-thumb'); await pg.wait_for_timeout(400)
        f0=await box(pg,'.project-file >> nth=0'); f1=await box(pg,'.project-file >> nth=1'); h2=await box(pg,'.project-section h2 >> nth=0')
        clip={'x':f0['x']-20,'y':h2['y']-16,'width':f1['x']+f1['width']-f0['x']+40,'height':f0['y']+f0['height']-h2['y']+30}
        await shot(pg,'u-newver',clip,[('.project-file >> nth=0 >> .file-hover-actions button >> nth=2','top',0),('.project-file >> nth=0 >> .file-hover-actions button >> nth=1','top',0),('.project-file >> nth=0 >> .file-version-badge',0,0),('.project-file >> nth=0 >> .file-history-link',0,0)])
        await pg.mouse.move(5,5)

        await pg.click('.vrow >> nth=0 >> .version-nodes li >> nth=1 >> button'); await pg.wait_for_timeout(300)
        await pg.click('.vrow.is-open >> text=이 버전으로 되돌리기'); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('.version-manager').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(300)
        await shot(pg,'u-version','.version-manager',[('.vrow.is-open .version-nodes li >> nth=1',0.5,0.3),('.vrow.is-open .version-detail-thumb',0.5,0.5),('.vrow.is-open .rollback-actions .btn-primary',0.5,0.5),('.seg >> nth=0',0.25,0.5)])

        await pg.goto(BASE+'#/browse?path='+urllib.parse.quote(SAEK_FOLDER)); await pg.wait_for_timeout(600)
        await shot(pg,'u-folder','.finder',[('.finder-side button >> nth=5',0.5,0.5),('.finder-crumbs',0.5,0.5),('.finder-copy',0.5,0.5),('.finder-grid li >> nth=0',0.5,0.35)])

        # ── 기획자 ──
        await pg.goto(BASE); await pg.wait_for_timeout(500)
        await pg.click('.hero-pill >> nth=1'); await pg.wait_for_timeout(500)
        await pg.click('.filter-toggle'); await pg.wait_for_timeout(300)
        await pg.click('fieldset.filter-group:has(legend:has-text("작업 유형")) label:has-text("상세페이지")'); await pg.wait_for_timeout(300)
        await pg.evaluate('scrollTo(0,0)')
        hb=await box(pg,'main .search-box'); pb=await box(pg,'.project-item >> nth=0')
        clip={'x':hb['x']-30,'y':hb['y']-20,'width':1280-2*(hb['x']-30),'height':pb['y']+pb['height']*0.75-hb['y']+20}
        await shot(pg,'p-search',clip,[('main .search-box input',0.2,0.5),('.filter-toggle',0.5,0.5),('fieldset.filter-group:has(legend:has-text("작업 유형")) label:has-text("상세페이지")',0.3,0.5),('.unit-toggle',0.5,0.5),('.project-item >> nth=0',0.5,0.3)])

        await pg.goto(BASE+'#/project?key='+urllib.parse.quote(SAEK_KEY)); await pg.wait_for_timeout(600)
        hb=await box(pg,'.project-head'); fb=await box(pg,'.project-file >> nth=0')
        clip={'x':hb['x']-16,'y':hb['y']-16,'width':hb['width']+32,'height':fb['y']+fb['height']*0.8-hb['y']+16}
        await shot(pg,'p-project',clip,[('.project-head h1',0.3,0.5),('.project-meta',0.4,0.5),('.project-actions .btn >> nth=0',0.5,0.5),('.project-actions .btn >> nth=1',0.5,0.5),('.project-section h2 >> nth=0',0.2,0.5)])

        await pg.goto(BASE+'#/journal'); await pg.wait_for_timeout(600)
        hb=await box(pg,'.jr-head'); fb=await box(pg,'.jr-feature')
        clip={'x':hb['x']-16,'y':hb['y']-16,'width':hb['width']+32,'height':fb['y']+fb['height']-hb['y']+32}
        await shot(pg,'p-journal',clip,[('.jr-cats',0.3,0.5),('.jr-tags',0.2,0.5),('.jr-head .btn-primary',0.5,0.5),('.jr-feature',0.25,0.4)])

        await pg.goto(BASE+'#/journal?id=post-2027-trends'); await pg.wait_for_timeout(600)
        hb=await box(pg,'.jr-palette'); fb=await box(pg,'.jr-body h2 >> nth=0')
        clip={'x':hb['x']-24,'y':hb['y']-24,'width':hb['width']+48,'height':fb['y']+fb['height']-hb['y']+60}
        await pg.click('.jr-palette button >> nth=0'); await pg.wait_for_timeout(100)
        await shot(pg,'p-palette',clip,[('.jr-palette button >> nth=0',0.5,0.25),('.jr-palette button >> nth=0 >> small >> nth=1',0.5,0.5)])

        await pg.goto(BASE+'#/detail?id=asset-12'); await pg.wait_for_timeout(600)
        hb=await box(pg,'.detail-layout'); nb=await box(pg,'.detail-primary')
        clip={'x':hb['x']-16,'y':hb['y']-16,'width':hb['width']+32,'height':nb['y']+nb['height']-hb['y']+32}
        await shot(pg,'p-license',clip,[('.essential-meta .status',0.5,0.5),('.license-note',0.1,0.5),('.detail-primary .btn-primary',0.5,0.5)])

        # ── 관리자 ──
        await pg.goto(BASE+'#/detail?id=asset-6'); await pg.wait_for_timeout(600)
        await pg.click('.preview-versions button >> nth=1'); await pg.wait_for_timeout(300)
        hb=await box(pg,'.detail-layout'); 
        clip={'x':hb['x']-16,'y':hb['y']-16,'width':hb['width']+32,'height':min(hb['height'],760)+32}
        await shot(pg,'a-version',clip,[('.preview-versions button >> nth=1',0,0),('.preview-old-bar button',0,0),('.version-list',0,0)])

        # 관리자 모드 전환
        await pg.click('button[aria-label="전체 메뉴 열기"] >> visible=true'); await pg.wait_for_timeout(500)
        await pg.evaluate("document.querySelector('.drawer-bottom details').open = true"); await pg.wait_for_timeout(300)
        db=await box(pg,'.drawer-bottom'); nb=await box(pg,'.drawer nav button >> nth=-1')
        await shot(pg,'a-role',{'x':db['x']-24,'y':db['y']-24,'width':db['width']+48,'height':db['height']+48},[('.drawer-bottom summary',0.3,0.5),('select[aria-label="샘플 사용자 권한"]',0.5,0.5)])
        await pg.select_option('select[aria-label="샘플 사용자 권한"]','admin'); await pg.wait_for_timeout(200)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)

        await pg.wait_for_timeout(3200)
        await pg.goto(BASE+'#/detail?id=asset-6'); await pg.wait_for_timeout(600)
        await pg.click('text=정보 수정'); await pg.wait_for_timeout(300)
        await pg.select_option('select[aria-label="라이선스 상태"]','needs_review')
        await pg.evaluate("document.querySelector('select[aria-label=\"라이선스 상태\"]').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(300)
        await shot(pg,'a-license-edit','.edit-form',[('select[aria-label="라이선스 상태"]',0.5,0.5),('textarea[aria-label="라이선스 메모"]',0.2,0.5),('.edit-form > .btn-primary',0.5,0.5)])

        await pg.goto(BASE+'#/license'); await pg.wait_for_timeout(600)
        await pg.click('.font-row >> nth=0 >> summary'); await pg.wait_for_timeout(300)
        hb=await box(pg,'.page-title'); fb=await box(pg,'.font-row >> nth=1')
        clip={'x':hb['x']-16,'y':hb['y']-16,'width':hb['width']+32,'height':fb['y']+fb['height']-hb['y']+32}
        await shot(pg,'a-license',clip,[('.type-tabs',0.3,0.5),('.small-search',0.5,0.5),('.font-row >> nth=0 >> summary',0.2,0.5),('.font-details',0.5,0.5)])

        json.dump(DATA, open(os.path.join(ROOT,'src','data','guideShots.json'),'w'), ensure_ascii=False, indent=1)
        await b.close()
asyncio.run(main())
