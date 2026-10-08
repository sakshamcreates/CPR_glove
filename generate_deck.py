import sys
import os

# Add user site-packages to sys.path so pptx is found
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if user_site not in sys.path:
    sys.path.insert(0, user_site)

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_path="MANOMITRA_Master_Pitch_Deck.pptx"):
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # =========================================================================
    # VISUAL DESIGN SYSTEM: WARM OFF-WHITE BEIGE + FOREST GREEN + BURGUNDY/ALERT
    # =========================================================================
    BEIGE_BG        = RGBColor(246, 243, 237)  # Warm Off-White / Beige #F6F3ED
    CARD_BG         = RGBColor(255, 255, 255)  # Crisp Pure White #FFFFFF
    CARD_BORDER     = RGBColor(226, 220, 209)  # Subtle Sand Muted Border #E2DCD1
    
    # Greens (Brand, System, Flow, Success)
    GREEN_PRIMARY   = RGBColor(27, 67, 50)     # Deep Forest Green #1B4332
    GREEN_ACCENT    = RGBColor(45, 106, 79)    # Dark Green Accent #2D6A4F
    GREEN_LIGHT     = RGBColor(235, 245, 238)  # Soft Sage Green Tint #EBF5EE
    
    # Burgundy / Muted Red (Alerts, Blindspots, Gaps)
    BURGUNDY_DARK   = RGBColor(107, 29, 47)    # Rich Deep Burgundy #6B1D2F
    BURGUNDY_LIGHT  = RGBColor(253, 242, 244)  # Delicate Warm Burgundy Tint #FDF2F4
    
    # Neutrals / Text
    TEXT_MAIN       = RGBColor(28, 25, 23)     # Deep Charcoal Espresso #1C1917
    TEXT_MUTED      = RGBColor(78, 71, 65)     # Warm Muted Charcoal #4E4741
    TEXT_SUBTLE     = RGBColor(120, 113, 108)  # Tertiary Sand Slate #78716C

    def add_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = BEIGE_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, slide_num, slide_title, subtitle=None):
        # Header Row
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8.0), Inches(0.35))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        tf_tag.margin_left = tf_tag.margin_right = tf_tag.margin_top = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = "MANOMITRA"
        p_tag.font.bold = True
        p_tag.font.size = Pt(10)
        p_tag.font.color.rgb = GREEN_ACCENT

        num_box = slide.shapes.add_textbox(Inches(10.5), Inches(0.4), Inches(2.033), Inches(0.35))
        tf_num = num_box.text_frame
        tf_num.word_wrap = True
        tf_num.margin_left = tf_num.margin_right = tf_num.margin_top = tf_num.margin_bottom = 0
        p_num = tf_num.paragraphs[0]
        p_num.alignment = PP_ALIGN.RIGHT
        p_num.text = f"{slide_num:02d} / 10"
        p_num.font.bold = True
        p_num.font.size = Pt(11)
        p_num.font.color.rgb = TEXT_SUBTLE

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.733), Inches(0.65))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_right = tf_title.margin_top = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = slide_title
        p_title.font.bold = True
        p_title.font.size = Pt(22)
        p_title.font.color.rgb = GREEN_PRIMARY

        # Subtitle
        if subtitle:
            sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.4))
            tf_sub = sub_box.text_frame
            tf_sub.word_wrap = True
            tf_sub.margin_left = tf_sub.margin_right = tf_sub.margin_top = tf_sub.margin_bottom = 0
            p_sub = tf_sub.paragraphs[0]
            p_sub.text = subtitle
            p_sub.font.size = Pt(12)
            p_sub.font.color.rgb = TEXT_MUTED

    def add_card(slide, left, top, width, height, title=None, border_color=CARD_BORDER, bg_color=CARD_BG, title_color=GREEN_PRIMARY):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.2)
        if title:
            tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.18), width - Inches(0.4), Inches(0.35))
            tf = tb.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
            p = tf.paragraphs[0]
            p.text = title
            p.font.bold = True
            p.font.size = Pt(12)
            p.font.color.rgb = title_color
        return shape

    def add_arrow(slide, left, top, width, height, color=GREEN_ACCENT, text="➔"):
        tb = slide.shapes.add_textbox(left, top, width, height)
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = text
        p.font.bold = True
        p.font.size = Pt(18)
        p.font.color.rgb = color
        return tb

    def set_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_text

    # =========================================================================
    # SLIDE 1: COVER
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_background(s1)

    # Main Brand Name
    b_box = s1.shapes.add_textbox(Inches(0.8), Inches(1.0), Inches(11.733), Inches(1.1))
    btf = b_box.text_frame
    btf.word_wrap = True
    bp = btf.paragraphs[0]
    bp.text = "MANOMITRA"
    bp.font.bold = True
    bp.font.size = Pt(56)
    bp.font.color.rgb = GREEN_PRIMARY

    # Subheadline
    t_box = s1.shapes.add_textbox(Inches(0.8), Inches(2.1), Inches(11.733), Inches(0.5))
    ttf = t_box.text_frame
    ttf.word_wrap = True
    tp = ttf.paragraphs[0]
    tp.text = '"Your Companion for a Healthier Mind."'
    tp.font.bold = True
    tp.font.size = Pt(20)
    tp.font.color.rgb = BURGUNDY_DARK

    # Descriptor
    d_box = s1.shapes.add_textbox(Inches(0.8), Inches(2.65), Inches(11.733), Inches(0.45))
    dtf = d_box.text_frame
    dtf.word_wrap = True
    dp = dtf.paragraphs[0]
    dp.text = "AI-Assisted Cognitive Engagement & Caregiver Support for Ageing Minds"
    dp.font.size = Pt(13)
    dp.font.color.rgb = TEXT_MUTED

    # Ecosystem Visual: SENIOR ➔ MANOMITRA ➔ CAREGIVER
    eco_container = add_card(s1, Inches(0.8), Inches(3.4), Inches(11.733), Inches(3.4), border_color=CARD_BORDER)
    
    # 3 Entity Boxes
    e_y = Inches(3.75)
    e_h = Inches(1.2)
    # Senior
    add_card(s1, Inches(1.2), e_y, Inches(2.8), e_h, border_color=GREEN_ACCENT, bg_color=GREEN_LIGHT)
    tb = s1.shapes.add_textbox(Inches(1.3), e_y + Inches(0.2), Inches(2.6), Inches(0.8))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = "👴  SENIOR"
    p1.font.bold = True
    p1.font.size = Pt(13)
    p1.font.color.rgb = GREEN_PRIMARY
    p2 = tf.add_paragraph()
    p2.text = "Voice-friendly play & daily routine"
    p2.font.size = Pt(10)
    p2.font.color.rgb = TEXT_MUTED

    # Arrow 1
    add_arrow(s1, Inches(4.1), e_y + Inches(0.35), Inches(0.7), Inches(0.5))

    # Manomitra Core
    add_card(s1, Inches(4.9), e_y, Inches(3.533), e_h, border_color=GREEN_PRIMARY, bg_color=CARD_BG)
    tb = s1.shapes.add_textbox(Inches(5.0), e_y + Inches(0.2), Inches(3.333), Inches(0.8))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = "🧠  MANOMITRA PLATFORM"
    p1.font.bold = True
    p1.font.size = Pt(13)
    p1.font.color.rgb = GREEN_PRIMARY
    p2 = tf.add_paragraph()
    p2.text = "Adaptive engine & offline-first sync"
    p2.font.size = Pt(10)
    p2.font.color.rgb = TEXT_MUTED

    # Arrow 2
    add_arrow(s1, Inches(8.533), e_y + Inches(0.35), Inches(0.7), Inches(0.5))

    # Caregiver
    add_card(s1, Inches(9.333), e_y, Inches(2.8), e_h, border_color=BURGUNDY_DARK, bg_color=BURGUNDY_LIGHT)
    tb = s1.shapes.add_textbox(Inches(9.433), e_y + Inches(0.2), Inches(2.6), Inches(0.8))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = "👨‍👩‍👧  CAREGIVER"
    p1.font.bold = True
    p1.font.size = Pt(13)
    p1.font.color.rgb = BURGUNDY_DARK
    p2 = tf.add_paragraph()
    p2.text = "WhatsApp alerts & weekly trends"
    p2.font.size = Pt(10)
    p2.font.color.rgb = TEXT_MUTED

    # Down connector to the 5 loop steps
    add_arrow(s1, Inches(6.3), Inches(4.95), Inches(0.7), Inches(0.4), text="↓")

    # The 5 Core Steps
    steps = ["01 PLAY", "02 MEASURE", "03 ADAPT", "04 TRACK", "05 SUPPORT"]
    step_w = Inches(1.9)
    step_gap = Inches(0.35)
    for i, st in enumerate(steps):
        sx = Inches(1.3) + i * (step_w + step_gap)
        sc = add_card(s1, sx, Inches(5.45), step_w, Inches(0.75), border_color=GREEN_ACCENT, bg_color=GREEN_LIGHT)
        tb = s1.shapes.add_textbox(sx, Inches(5.62), step_w, Inches(0.4))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = st
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = GREEN_PRIMARY
        if i < 4:
            add_arrow(s1, sx + step_w, Inches(5.6), step_gap, Inches(0.4), text="➔")

    set_notes(s1, "Judges, over eight million elderly Indians are quietly navigating cognitive decline today. Meet MANOMITRA—an AI-assisted cognitive engagement and caregiver support platform designed to connect senior daily play directly with caregiver peace of mind.")

    # =========================================================================
    # SLIDE 2: THE PROBLEM
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_background(s2)
    add_header(s2, 2, "THE PROBLEM", "Cognitive decline affects both the senior and the entire family caregiving ecosystem.")

    # Main Visual: Horizontal Causal Flow
    flow_y = Inches(1.8)
    flow_h = Inches(2.2)
    add_card(s2, Inches(0.8), flow_y, Inches(11.733), flow_h, "THE CAUSAL ESCALATION", border_color=BURGUNDY_DARK, bg_color=BURGUNDY_LIGHT, title_color=BURGUNDY_DARK)
    
    nodes = [
        ("COGNITIVE DRIFT", "Subtle micro-changes in processing speed & recall", BURGUNDY_DARK),
        ("DAILY ROUTINE CHANGES", "Missed medications, confusion & withdrawal", GREEN_PRIMARY),
        ("CAREGIVER BLINDSPOT", "Families lack continuous visibility between visits", BURGUNDY_DARK),
        ("REACTIVE CARE", "Late crisis awareness & emergency intervention", BURGUNDY_DARK)
    ]
    node_w = Inches(2.45)
    node_gap = Inches(0.35)
    for i, (head, sub, col) in enumerate(nodes):
        nx = Inches(1.1) + i * (node_w + node_gap)
        add_card(s2, nx, flow_y + Inches(0.55), node_w, Inches(1.35), border_color=col, bg_color=CARD_BG)
        tb = s2.shapes.add_textbox(nx + Inches(0.15), flow_y + Inches(0.7), node_w - Inches(0.3), Inches(1.05))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = head
        p1.font.bold = True
        p1.font.size = Pt(11)
        p1.font.color.rgb = col
        p2 = tf.add_paragraph()
        p2.text = sub
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(4)

        if i < 3:
            add_arrow(s2, nx + node_w, flow_y + Inches(1.0), node_gap, Inches(0.4), color=BURGUNDY_DARK)

    # 2 Major Visual Statistics Cards
    s_y = Inches(4.3)
    s_w = Inches(5.75)
    s_h = Inches(2.3)
    # Stat 1
    add_card(s2, Inches(0.8), s_y, s_w, s_h, border_color=GREEN_ACCENT)
    tb1 = s2.shapes.add_textbox(Inches(1.1), s_y + Inches(0.3), s_w - Inches(0.6), Inches(1.7))
    tf1 = tb1.text_frame
    p1 = tf1.paragraphs[0]
    p1.text = "7.4%"
    p1.font.bold = True
    p1.font.size = Pt(48)
    p1.font.color.rgb = GREEN_PRIMARY
    p2 = tf1.add_paragraph()
    p2.text = "Dementia Prevalence in Indian Seniors (Ages 60+)"
    p2.font.bold = True
    p2.font.size = Pt(12)
    p2.font.color.rgb = TEXT_MAIN
    p3 = tf1.add_paragraph()
    p3.text = "Demonstrated across urban and rural demographics in the national LASI-DAD study."
    p3.font.size = Pt(10)
    p3.font.color.rgb = TEXT_MUTED

    # Stat 2
    add_card(s2, Inches(6.783), s_y, s_w, s_h, border_color=BURGUNDY_DARK)
    tb2 = s2.shapes.add_textbox(Inches(7.083), s_y + Inches(0.3), s_w - Inches(0.6), Inches(1.7))
    tf2 = tb2.text_frame
    p1 = tf2.paragraphs[0]
    p1.text = "8.8M ➔ 14.3M"
    p1.font.bold = True
    p1.font.size = Pt(42)
    p1.font.color.rgb = BURGUNDY_DARK
    p2 = tf2.add_paragraph()
    p2.text = "Projected Cases in India (2026 to 2036)"
    p2.font.bold = True
    p2.font.size = Pt(12)
    p2.font.color.rgb = TEXT_MAIN
    p3 = tf2.add_paragraph()
    p3.text = "+25% growth over the next decade creating an overwhelming informal caregiving challenge."
    p3.font.size = Pt(10)
    p3.font.color.rgb = TEXT_MUTED

    # Small Reference Footer
    f_box = s2.shapes.add_textbox(Inches(0.8), Inches(6.75), Inches(11.733), Inches(0.35))
    ftf = f_box.text_frame
    fp = ftf.paragraphs[0]
    fp.text = "Data Sources: Longitudinal Aging Study in India Diagnostic Assessment of Dementia (LASI-DAD), The Lancet Commission (2024)."
    fp.font.size = Pt(9)
    fp.font.color.rgb = TEXT_SUBTLE

    set_notes(s2, "In India, 7.4% of seniors experience cognitive decline. When memory loss begins, it creates a cascade: routine breakdown leads to caregiver uncertainty, resulting in delayed medical attention. The problem affects both the senior and the entire caregiving ecosystem.")

    # =========================================================================
    # SLIDE 3: WHY CURRENT APPROACHES FALL SHORT
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_background(s3)
    add_header(s3, 3, "THE GAP IN EXISTING SOLUTIONS", "Current options leave a disconnect between daily senior engagement and caregiver visibility.")

    # Comparison Matrix Table
    # Dimensions: Daily Engagement | Caregiver Loop | Offline Use | Indian Context | Adaptive Support
    table_shape = s3.shapes.add_table(6, 6, Inches(0.8), Inches(1.8), Inches(11.733), Inches(4.3))
    table = table_shape.table
    table.columns[0].width = Inches(2.733)
    table.columns[1].width = Inches(1.8)
    table.columns[2].width = Inches(1.8)
    table.columns[3].width = Inches(1.8)
    table.columns[4].width = Inches(1.8)
    table.columns[5].width = Inches(1.8)

    headers = ["SOLUTION CATEGORY", "DAILY ENGAGE", "CAREGIVER LOOP", "OFFLINE USE", "INDIAN CONTEXT", "ADAPTIVE CARE"]
    for col_idx, htext in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = GREEN_PRIMARY
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER if col_idx > 0 else PP_ALIGN.LEFT
        p.text = htext
        p.font.bold = True
        p.font.size = Pt(10)
        p.font.color.rgb = RGBColor(255, 255, 255)

    rows_data = [
        ("Clinical Therapy (Hospital / Paper)", "✕", "✕", "✓", "△", "✕", CARD_BG, TEXT_MAIN),
        ("Brain Training Apps (Western)", "✓", "✕", "✕", "✕", "△", CARD_BG, TEXT_MAIN),
        ("Generic AI Chatbots", "△", "✕", "✕", "✕", "✕", CARD_BG, TEXT_MAIN),
        ("Caregiver Alarms & Trackers", "✕", "✓", "△", "△", "✕", CARD_BG, TEXT_MAIN),
        ("MANOMITRA", "✓", "✓", "✓", "✓", "✓", GREEN_LIGHT, GREEN_PRIMARY)
    ]

    for row_idx, rdata in enumerate(rows_data, start=1):
        bg_col = rdata[6]
        txt_col = rdata[7]
        is_highlight = (row_idx == 5)
        for col_idx in range(6):
            cell = table.cell(row_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg_col
            p = cell.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER if col_idx > 0 else PP_ALIGN.LEFT
            p.text = rdata[col_idx]
            p.font.bold = is_highlight
            p.font.size = Pt(13 if col_idx > 0 else 11)
            p.font.color.rgb = txt_col

    # Bottom visual statement
    b_pill = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.3), Inches(11.733), Inches(0.65))
    b_pill.fill.solid()
    b_pill.fill.fore_color.rgb = GREEN_LIGHT
    b_pill.line.color.rgb = GREEN_ACCENT
    b_pill.line.width = Pt(1)
    bptf = b_pill.text_frame
    bpp = bptf.paragraphs[0]
    bpp.alignment = PP_ALIGN.CENTER
    bpp.text = "One continuous loop for senior engagement + caregiver support."
    bpp.font.bold = True
    bpp.font.size = Pt(12)
    bpp.font.color.rgb = GREEN_PRIMARY

    set_notes(s3, "Existing alternatives either focus exclusively on cognitive puzzles without family visibility, or on administrative caregiver alarms with zero patient joy. MANOMITRA closes this gap by providing an offline-capable, culturally grounded loop connecting daily play to caregiver support.")

    # =========================================================================
    # SLIDE 4: THE SOLUTION (THE MANOMITRA CARE LOOP)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_background(s4)
    add_header(s4, 4, "THE MANOMITRA CARE LOOP", "A continuous 5-stage loop connecting daily mental vitality with proactive family visibility.")

    # Center Engine Card
    center_w = Inches(3.2)
    center_h = Inches(1.4)
    add_card(s4, Inches(5.066), Inches(3.5), center_w, center_h, border_color=GREEN_PRIMARY, bg_color=GREEN_PRIMARY)
    tb_c = s4.shapes.add_textbox(Inches(5.166), Inches(3.8), Inches(3.0), Inches(0.8))
    tf_c = tb_c.text_frame
    p_c1 = tf_c.paragraphs[0]
    p_c1.alignment = PP_ALIGN.CENTER
    p_c1.text = "MANOMITRA ENGINE"
    p_c1.font.bold = True
    p_c1.font.size = Pt(14)
    p_c1.font.color.rgb = RGBColor(255, 255, 255)
    p_c2 = tf_c.add_paragraph()
    p_c2.alignment = PP_ALIGN.CENTER
    p_c2.text = "Adaptive Care Intelligence"
    p_c2.font.size = Pt(10)
    p_c2.font.color.rgb = GREEN_LIGHT

    # 5 Circular Loop Nodes
    # 01 PLAY (Top)
    add_card(s4, Inches(4.866), Inches(1.8), Inches(3.6), Inches(1.15), border_color=GREEN_ACCENT, bg_color=CARD_BG)
    tb = s4.shapes.add_textbox(Inches(4.966), Inches(1.95), Inches(3.4), Inches(0.85))
    tf = tb.text_frame
    tf.paragraphs[0].text = "01 • PLAY"
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.size = Pt(12)
    tf.paragraphs[0].font.color.rgb = GREEN_PRIMARY
    p = tf.add_paragraph()
    p.text = "Culturally rooted cognitive mini-games"
    p.font.size = Pt(9.5)
    p.font.color.rgb = TEXT_MUTED

    # 02 MEASURE (Right-Top)
    add_card(s4, Inches(8.8), Inches(2.6), Inches(3.6), Inches(1.15), border_color=GREEN_ACCENT, bg_color=CARD_BG)
    tb = s4.shapes.add_textbox(Inches(8.9), Inches(2.75), Inches(3.4), Inches(0.85))
    tf = tb.text_frame
    tf.paragraphs[0].text = "02 • MEASURE"
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.size = Pt(12)
    tf.paragraphs[0].font.color.rgb = GREEN_PRIMARY
    p = tf.add_paragraph()
    p.text = "Accuracy + response latency telemetry"
    p.font.size = Pt(9.5)
    p.font.color.rgb = TEXT_MUTED

    # 03 ADAPT (Right-Bottom)
    add_card(s4, Inches(8.8), Inches(4.7), Inches(3.6), Inches(1.15), border_color=GREEN_ACCENT, bg_color=CARD_BG)
    tb = s4.shapes.add_textbox(Inches(8.9), Inches(4.85), Inches(3.4), Inches(0.85))
    tf = tb.text_frame
    tf.paragraphs[0].text = "03 • ADAPT"
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.size = Pt(12)
    tf.paragraphs[0].font.color.rgb = GREEN_PRIMARY
    p = tf.add_paragraph()
    p.text = "Dynamic difficulty scaling & gentle hints"
    p.font.size = Pt(9.5)
    p.font.color.rgb = TEXT_MUTED

    # 04 TRACK (Left-Bottom)
    add_card(s4, Inches(0.933), Inches(4.7), Inches(3.6), Inches(1.15), border_color=GREEN_ACCENT, bg_color=CARD_BG)
    tb = s4.shapes.add_textbox(Inches(1.033), Inches(4.85), Inches(3.4), Inches(0.85))
    tf = tb.text_frame
    tf.paragraphs[0].text = "04 • TRACK"
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.size = Pt(12)
    tf.paragraphs[0].font.color.rgb = GREEN_PRIMARY
    p = tf.add_paragraph()
    p.text = "7-Day adherence & cognitive trend curves"
    p.font.size = Pt(9.5)
    p.font.color.rgb = TEXT_MUTED

    # 05 SUPPORT (Left-Top)
    add_card(s4, Inches(0.933), Inches(2.6), Inches(3.6), Inches(1.15), border_color=BURGUNDY_DARK, bg_color=BURGUNDY_LIGHT)
    tb = s4.shapes.add_textbox(Inches(1.033), Inches(2.75), Inches(3.4), Inches(0.85))
    tf = tb.text_frame
    tf.paragraphs[0].text = "05 • SUPPORT"
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.size = Pt(12)
    tf.paragraphs[0].font.color.rgb = BURGUNDY_DARK
    p = tf.add_paragraph()
    p.text = "WhatsApp alerts & routine confirmation"
    p.font.size = Pt(9.5)
    p.font.color.rgb = TEXT_MUTED

    # Connectors
    add_arrow(s4, Inches(8.0), Inches(2.0), Inches(0.7), Inches(0.4), text="➔")
    add_arrow(s4, Inches(10.2), Inches(3.9), Inches(0.7), Inches(0.4), text="↓")
    add_arrow(s4, Inches(5.8), Inches(5.0), Inches(1.7), Inches(0.4), text="← ➔")
    add_arrow(s4, Inches(2.4), Inches(3.9), Inches(0.7), Inches(0.4), text="↑")
    add_arrow(s4, Inches(4.2), Inches(2.0), Inches(0.7), Inches(0.4), text="➔")

    # Bottom statement
    b_stat = s4.shapes.add_textbox(Inches(0.8), Inches(6.4), Inches(11.733), Inches(0.5))
    btf = b_stat.text_frame
    bp = btf.paragraphs[0]
    bp.alignment = PP_ALIGN.CENTER
    bp.text = '"The loop is the product."'
    bp.font.bold = True
    bp.font.size = Pt(15)
    bp.font.color.rgb = GREEN_PRIMARY

    set_notes(s4, "The MANOMITRA Care Loop is the product. Seniors play culturally familiar mini-games. The engine measures reaction time and errors, adapts difficulty, tracks 7-day stability trends, and keeps the caregiver informed through WhatsApp.")

    # =========================================================================
    # SLIDE 5: HOW IT WORKS
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_background(s5)
    add_header(s5, 5, "HOW MANOMITRA WORKS", "Frictionless for the senior. Actionable for the family.")

    # 3-Lane Horizontal/Vertical Architecture Diagram
    lane_y = Inches(1.7)
    lane_h = Inches(3.5)
    lane_w = Inches(3.77)
    lane_gap = Inches(0.2)

    lanes = [
        ("SENIOR", GREEN_PRIMARY, GREEN_LIGHT, [
            ("Simple Entry", "1-tap passkey biometric or tactile PIN"),
            ("5-Min Cognitive Play", "Voice-guided culturally grounded games"),
            ("Routine Check-In", "Morning medication & hydration confirmation")
        ]),
        ("MANOMITRA ENGINE", GREEN_ACCENT, CARD_BG, [
            ("Capture Performance", "Unobtrusive latency & error recording"),
            ("Adapt Difficulty", "Within-session pacing & cross-session baseline"),
            ("Store Locally & Sync", "IndexedDB local persistence; sync on connect")
        ]),
        ("CAREGIVER", BURGUNDY_DARK, BURGUNDY_LIGHT, [
            ("WhatsApp Updates", "Daily routine check-in confirmations"),
            ("7-Day Trends", "Visual adherence & stability analytics"),
            ("Red-Flag Signals", "Immediate alerts for missed routines")
        ])
    ]

    for i, (ltitle, lcolor, lbg, items) in enumerate(lanes):
        lx = Inches(0.8) + i * (lane_w + lane_gap)
        add_card(s5, lx, lane_y, lane_w, lane_h, border_color=lcolor, bg_color=lbg)
        tb = s5.shapes.add_textbox(lx + Inches(0.2), lane_y + Inches(0.2), lane_w - Inches(0.4), lane_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p0 = tf.paragraphs[0]
        p0.text = ltitle
        p0.font.bold = True
        p0.font.size = Pt(13)
        p0.font.color.rgb = lcolor

        for head, body in items:
            p1 = tf.add_paragraph()
            p1.text = f"• {head}"
            p1.font.bold = True
            p1.font.size = Pt(11)
            p1.font.color.rgb = TEXT_MAIN
            p1.space_before = Pt(8)

            p2 = tf.add_paragraph()
            p2.text = body
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_MUTED

    # Connecting arrows between lanes
    add_arrow(s5, Inches(4.37), lane_y + Inches(1.5), Inches(0.4), Inches(0.5))
    add_arrow(s5, Inches(8.34), lane_y + Inches(1.5), Inches(0.4), Inches(0.5))

    # Prominent Offline Flow Box (Bottom)
    off_y = Inches(5.45)
    add_card(s5, Inches(0.8), off_y, Inches(11.733), Inches(1.4), "OFFLINE-CAPABLE ARCHITECTURE", border_color=GREEN_ACCENT, bg_color=GREEN_LIGHT)
    
    flow_steps = ["GAMEPLAY", "LOCAL STORAGE\n(IndexedDB)", "BACKGROUND\nSYNC QUEUE", "INTERNET\nRETURNS", "CLOUD\nSYNC"]
    step_w = Inches(1.9)
    step_gap = Inches(0.4)
    for i, st in enumerate(flow_steps):
        fx = Inches(1.2) + i * (step_w + step_gap)
        add_card(s5, fx, off_y + Inches(0.5), step_w, Inches(0.7), border_color=GREEN_PRIMARY, bg_color=CARD_BG)
        tb = s5.shapes.add_textbox(fx, off_y + Inches(0.55), step_w, Inches(0.6))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = st
        p.font.bold = True
        p.font.size = Pt(9.5)
        p.font.color.rgb = GREEN_PRIMARY
        if i < 4:
            add_arrow(s5, fx + step_w, off_y + Inches(0.6), step_gap, Inches(0.4), text="➔")

    set_notes(s5, "The system operates in three clear lanes: Senior, Engine, and Caregiver. Most importantly, the offline flow guarantees uninterrupted operation. When connectivity drops, games and routines save to IndexedDB and automatically sync when reconnected.")

    # =========================================================================
    # SLIDE 6: WHAT WE HAVE BUILT
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_background(s6)
    add_header(s6, 6, "WORKING PROTOTYPE", "Tested core functionality across patient interface, edge storage, and caregiver notification.")

    # 5 Proof Blocks (Left 7.8 inches)
    p_w = Inches(3.7)
    p_h = Inches(1.5)
    proof_blocks = [
        ("🎮 5 Cognitive Games", "Market Day Basket • Daily Routine Sequencer • Faces & Recall • Odd One Out • Sound & Rhythm Match", GREEN_PRIMARY),
        ("📱 Offline-First PWA", "React 19 + Workbox caching for zero-internet operation and IndexedDB local routine persistence", GREEN_PRIMARY),
        ("🤖 Adaptive Engine", "FastAPI microservice evaluating response latency and error clusters to calibrate task difficulty", GREEN_PRIMARY),
        ("👨‍👩‍👧 Caregiver Portal", "Web command center visualizing 7-day adherence curves, latency trends, and emergency red-flags", GREEN_PRIMARY),
        ("💬 WhatsApp Companion", "Live WhatsApp Cloud API test bot (wa.me/15556680031) delivering routine nudges and confirmations", BURGUNDY_DARK)
    ]

    for i, (title, desc, col) in enumerate(proof_blocks):
        row = i // 2
        col_idx = i % 2
        if i == 4:
            col_idx = 0
            cx = Inches(0.8)
            cy = Inches(1.8) + 2 * Inches(1.65)
            cw = Inches(7.6)
        else:
            cx = Inches(0.8) + col_idx * Inches(3.9)
            cy = Inches(1.8) + row * Inches(1.65)
            cw = p_w

        add_card(s6, cx, cy, cw, p_h, border_color=col)
        tb = s6.shapes.add_textbox(cx + Inches(0.2), cy + Inches(0.2), cw - Inches(0.4), p_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.bold = True
        p1.font.size = Pt(12)
        p1.font.color.rgb = col
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(3)

    # Built vs Planned Distinction Card (Right 3.9 inches)
    add_card(s6, Inches(8.6), Inches(1.8), Inches(3.933), Inches(4.8), "PROJECT STATUS: BUILT VS PLANNED", border_color=CARD_BORDER)
    tb_bp = s6.shapes.add_textbox(Inches(8.8), Inches(2.25), Inches(3.533), Inches(4.2))
    tf_bp = tb_bp.text_frame
    tf_bp.word_wrap = True

    p = tf_bp.paragraphs[0]
    p.text = "BUILT & FUNCTIONAL:"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = GREEN_PRIMARY

    built_bullets = [
        "✓ 5 Clinically mapped games",
        "✓ Offline PWA & IndexedDB sync",
        "✓ Adaptive difficulty microservice",
        "✓ Caregiver web portal",
        "✓ WhatsApp companion bot"
    ]
    for b in built_bullets:
        pb = tf_bp.add_paragraph()
        pb.text = b
        pb.font.size = Pt(9.5)
        pb.font.color.rgb = TEXT_MAIN

    p_plan = tf_bp.add_paragraph()
    p_plan.text = "PLANNED ROADMAP:"
    p_plan.font.bold = True
    p_plan.font.size = Pt(11)
    p_plan.font.color.rgb = BURGUNDY_DARK
    p_plan.space_before = Pt(14)

    plan_bullets = [
        "⏳ Feature phone IVR/SMS mode",
        "⏳ ASHA worker community tablet kiosk",
        "⏳ Tele-MANAS helpline referral integration"
    ]
    for b in plan_bullets:
        pb = tf_bp.add_paragraph()
        pb.text = b
        pb.font.size = Pt(9.5)
        pb.font.color.rgb = TEXT_MUTED

    set_notes(s6, "This is a working prototype. We have built 5 cognitive games, an offline-capable PWA, an adaptive difficulty engine, and a live WhatsApp companion. We clearly distinguish between what is working today and our planned future integrations.")

    # =========================================================================
    # SLIDE 7: WHERE AI ACTUALLY FITS
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_background(s7)
    add_header(s7, 7, "WHERE AI ACTUALLY FITS", "Purpose-built, explainable intelligence. Not a diagnostic system.")

    # Left: Vertical Pipeline (Input ➔ Process ➔ Analysis ➔ Output)
    add_card(s7, Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.1), "APPLIED ADAPTIVE PIPELINE", border_color=GREEN_PRIMARY)
    
    pipe_steps = [
        ("USER PERFORMANCE INPUT", "Accuracy • Reaction Time • Mistakes • Pauses", GREEN_PRIMARY),
        ("ADAPTIVE ENGINE", "Real-time pacing • Dynamic difficulty • Audio hints", GREEN_ACCENT),
        ("LONGITUDINAL ANALYSIS", "Multi-session reaction latency drift & recovery trends", GREEN_PRIMARY),
        ("CAREGIVER SIGNALS", "Weekly stability trends & alert notifications", BURGUNDY_DARK)
    ]
    for i, (p_title, p_desc, p_col) in enumerate(pipe_steps):
        py = Inches(2.3) + i * Inches(1.05)
        add_card(s7, Inches(1.1), py, Inches(5.4), Inches(0.8), border_color=p_col, bg_color=CARD_BG)
        tb = s7.shapes.add_textbox(Inches(1.25), py + Inches(0.1), Inches(5.1), Inches(0.6))
        tf = tb.text_frame
        p1 = tf.paragraphs[0]
        p1.text = p_title
        p1.font.bold = True
        p1.font.size = Pt(10.5)
        p1.font.color.rgb = p_col
        p2 = tf.add_paragraph()
        p2.text = p_desc
        p2.font.size = Pt(9)
        p2.font.color.rgb = TEXT_MUTED

        if i < 3:
            add_arrow(s7, Inches(3.5), py + Inches(0.78), Inches(0.6), Inches(0.3), text="↓")

    # Right Top: Gemini Context-Grounded Conversational AI
    add_card(s7, Inches(7.1), Inches(1.8), Inches(5.433), Inches(2.2), "CONVERSATIONAL COMPANION (GEMINI)", border_color=GREEN_ACCENT)
    tb_gem = s7.shapes.add_textbox(Inches(7.3), Inches(2.25), Inches(5.033), Inches(1.6))
    tf_gem = tb_gem.text_frame
    tf_gem.word_wrap = True
    p1 = tf_gem.paragraphs[0]
    p1.text = "• Context-constrained conversations grounded in schedule JSON"
    p1.font.size = Pt(10)
    p1.font.color.rgb = TEXT_MAIN
    p2 = tf_gem.add_paragraph()
    p2.text = "• Empathetic daily routine & reminiscence check-ins"
    p2.font.size = Pt(10)
    p2.font.color.rgb = TEXT_MAIN
    p2.space_before = Pt(4)
    p3 = tf_gem.add_paragraph()
    p3.text = "• Clinical medical questions redirected to family caregiver"
    p3.font.size = Pt(10)
    p3.font.color.rgb = TEXT_MAIN
    p3.space_before = Pt(4)

    # Right Middle: Voice Layer
    add_card(s7, Inches(7.1), Inches(4.2), Inches(5.433), Inches(1.4), "MULTIMODAL VOICE LAYER", border_color=GREEN_ACCENT)
    tb_v = s7.shapes.add_textbox(Inches(7.3), Inches(4.6), Inches(5.033), Inches(0.9))
    tf_v = tb_v.text_frame
    tf_v.word_wrap = True
    p1 = tf_v.paragraphs[0]
    p1.text = "• Web Speech API + Bhashini translation architecture"
    p1.font.size = Pt(10)
    p1.font.color.rgb = TEXT_MAIN
    p2 = tf_v.add_paragraph()
    p2.text = "• English and Hindi voice synthesis with auto-accent adaptation"
    p2.font.size = Pt(10)
    p2.font.color.rgb = TEXT_MAIN

    # Right Bottom: Defensible Failsafe Banner
    b_pill = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.1), Inches(5.8), Inches(5.433), Inches(1.1))
    b_pill.fill.solid()
    b_pill.fill.fore_color.rgb = GREEN_LIGHT
    b_pill.line.color.rgb = GREEN_ACCENT
    b_pill.line.width = Pt(1)
    bptf = b_pill.text_frame
    bptf.word_wrap = True
    bpp = bptf.paragraphs[0]
    bpp.text = "🛡️ DEFENSIBLE ENGINEERING BOUNDARIES:"
    bpp.font.bold = True
    bpp.font.size = Pt(10)
    bpp.font.color.rgb = GREEN_PRIMARY
    bp2 = bptf.add_paragraph()
    bp2.text = "• Local fallback when cloud services are unavailable (6s timeout)\n• Explicitly an engagement & monitoring tool, not a diagnostic system"
    bp2.font.size = Pt(9.5)
    bp2.font.color.rgb = TEXT_MUTED

    set_notes(s7, "We show exactly where AI fits: user performance enters, the adaptive engine adjusts difficulty, and longitudinal trends generate caregiver signals. Gemini is strictly context-grounded. We state clearly: this is an engagement and monitoring tool, not a diagnostic system.")

    # =========================================================================
    # SLIDE 8: SYSTEM ARCHITECTURE
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_background(s8)
    add_header(s8, 8, "SYSTEM ARCHITECTURE", "A modular, edge-first architecture ensuring uninterrupted access.")

    # Vertical Architecture Flow Nodes
    arch_nodes = [
        ("SENIOR INTERACTION", "Voice prompts • Giant 56px+ touch zones • Zero typing barrier", Inches(1.7), Inches(0.85), GREEN_PRIMARY, GREEN_LIGHT),
        ("PATIENT PWA", "React 19 • Vite • Web Speech API • WebAuthn biometric login", Inches(2.75), Inches(0.85), GREEN_PRIMARY, CARD_BG),
        ("LOCAL-FIRST STORAGE (EDGE)", "IndexedDB Cache & Sync Queue • 100% Offline-capable", Inches(3.8), Inches(0.85), GREEN_PRIMARY, GREEN_LIGHT),
        ("API / GATEWAY", "Node.js • Role-scoped JWT sessions • DPDP-aligned data architecture", Inches(4.85), Inches(0.85), GREEN_ACCENT, CARD_BG)
    ]

    for title, desc, ny, nh, border_col, bg_col in arch_nodes:
        add_card(s8, Inches(1.5), ny, Inches(6.0), nh, border_color=border_col, bg_color=bg_col)
        tb = s8.shapes.add_textbox(Inches(1.7), ny + Inches(0.12), Inches(5.6), nh - Inches(0.24))
        tf = tb.text_frame
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.bold = True
        p1.font.size = Pt(10.5)
        p1.font.color.rgb = border_col
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(9)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(2)

        if ny < Inches(4.8):
            add_arrow(s8, Inches(4.2), ny + nh - Inches(0.05), Inches(0.6), Inches(0.3), text="↓")

    # Offline-First Callout Badge on the Local-First Box
    off_badge = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.6), Inches(3.9), Inches(4.5), Inches(0.65))
    off_badge.fill.solid()
    off_badge.fill.fore_color.rgb = GREEN_PRIMARY
    off_badge.line.color.rgb = GREEN_PRIMARY
    obtf = off_badge.text_frame
    obp = obtf.paragraphs[0]
    obp.alignment = PP_ALIGN.CENTER
    obp.text = "⚡ OFFLINE-FIRST PATH: Operates with zero internet"
    obp.font.bold = True
    obp.font.size = Pt(10)
    obp.font.color.rgb = RGBColor(255, 255, 255)

    # Split Backend Layer: AI/ML vs Database
    add_arrow(s8, Inches(3.0), Inches(5.7), Inches(0.6), Inches(0.3), text="↓")
    add_arrow(s8, Inches(6.0), Inches(5.7), Inches(0.6), Inches(0.3), text="↓")

    # AI/ML
    add_card(s8, Inches(1.5), Inches(6.0), Inches(2.9), Inches(1.0), border_color=GREEN_ACCENT)
    tb = s8.shapes.add_textbox(Inches(1.6), Inches(6.08), Inches(2.7), Inches(0.85))
    tf = tb.text_frame
    tf.paragraphs[0].text = "AI / ML (FastAPI)"
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.size = Pt(10)
    tf.paragraphs[0].font.color.rgb = GREEN_ACCENT
    p = tf.add_paragraph()
    p.text = "Adaptive difficulty scoring"
    p.font.size = Pt(9)
    p.font.color.rgb = TEXT_MUTED

    # Database
    add_card(s8, Inches(4.6), Inches(6.0), Inches(2.9), Inches(1.0), border_color=GREEN_ACCENT)
    tb = s8.shapes.add_textbox(Inches(4.7), Inches(6.08), Inches(2.7), Inches(0.85))
    tf = tb.text_frame
    tf.paragraphs[0].text = "DATABASE (MongoDB)"
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.size = Pt(10)
    tf.paragraphs[0].font.color.rgb = GREEN_ACCENT
    p = tf.add_paragraph()
    p.text = "AES-256 encrypted at rest"
    p.font.size = Pt(9)
    p.font.color.rgb = TEXT_MUTED

    # Caregiver Layer (Right side)
    add_card(s8, Inches(8.0), Inches(4.85), Inches(4.1), Inches(2.15), "CAREGIVER DELIVERY LAYER", border_color=BURGUNDY_DARK, bg_color=BURGUNDY_LIGHT, title_color=BURGUNDY_DARK)
    tb_c = s8.shapes.add_textbox(Inches(8.2), Inches(5.35), Inches(3.7), Inches(1.5))
    tf_c = tb_c.text_frame
    p1 = tf_c.paragraphs[0]
    p1.text = "• Caregiver Web Dashboard"
    p1.font.bold = True
    p1.font.size = Pt(10.5)
    p1.font.color.rgb = TEXT_MAIN
    p1_sub = tf_c.add_paragraph()
    p1_sub.text = "7-day adherence & cognitive stability curves"
    p1_sub.font.size = Pt(9)
    p1_sub.font.color.rgb = TEXT_MUTED
    p2 = tf_c.add_paragraph()
    p2.text = "• WhatsApp Cloud API Gateway"
    p2.font.bold = True
    p2.font.size = Pt(10.5)
    p2.font.color.rgb = TEXT_MAIN
    p2.space_before = Pt(6)
    p2_sub = tf_c.add_paragraph()
    p2_sub.text = "Zero-install daily nudges & emergency red-flags"
    p2_sub.font.size = Pt(9)
    p2_sub.font.color.rgb = TEXT_MUTED

    set_notes(s8, "Our system architecture is edge-first. The patient PWA writes to local IndexedDB. The app functions completely without internet, and syncs to the Node.js API and FastAPI ML microservices when connection resumes, delivering insights to the caregiver dashboard and WhatsApp.")

    # =========================================================================
    # SLIDE 9: WHY MANOMITRA / DIFFERENTIATION
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_background(s9)
    add_header(s9, 9, "BUILT FOR INDIA'S REALITY", "Designed for challenging rural, multilingual, and low-connectivity environments.")

    # 5 Large Visual Pillars
    pillars = [
        ("🗣️", "LANGUAGE", "Vernacular-first", "Speech synthesis and UI text supporting diverse Indian languages.", GREEN_PRIMARY),
        ("👆", "ACCESSIBILITY", "Elder-friendly", "56px+ tactile buttons for trembling hands; high-contrast cataract palette.", GREEN_ACCENT),
        ("⚡", "CONNECTIVITY", "Offline-first", "100% functional during power cuts & blackouts via local IndexedDB caching.", GREEN_PRIMARY),
        ("🌾", "CULTURE", "Familiar content", "Indian bazaars, family albums, and daily routines replace abstract tests.", GREEN_ACCENT),
        ("👨‍👩‍👧", "CAREGIVING", "Closed-loop care", "Automated WhatsApp alerts give family visibility without surveillance stress.", BURGUNDY_DARK)
    ]

    p_w = Inches(2.22)
    p_gap = Inches(0.15)
    for i, (icon, ptitle, psub, pdesc, pcol) in enumerate(pillars):
        px = Inches(0.8) + i * (p_w + p_gap)
        add_card(s9, px, Inches(1.8), p_w, Inches(4.2), border_color=pcol)
        tb = s9.shapes.add_textbox(px + Inches(0.15), Inches(2.0), p_w - Inches(0.3), Inches(3.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p0 = tf.paragraphs[0]
        p0.alignment = PP_ALIGN.CENTER
        p0.text = icon
        p0.font.size = Pt(36)

        p1 = tf.add_paragraph()
        p1.alignment = PP_ALIGN.CENTER
        p1.text = ptitle
        p1.font.bold = True
        p1.font.size = Pt(13)
        p1.font.color.rgb = pcol
        p1.space_before = Pt(8)

        p2 = tf.add_paragraph()
        p2.alignment = PP_ALIGN.CENTER
        p2.text = psub
        p2.font.bold = True
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_MAIN
        p2.space_before = Pt(4)

        p3 = tf.add_paragraph()
        p3.text = pdesc
        p3.font.size = Pt(9.5)
        p3.font.color.rgb = TEXT_MUTED
        p3.space_before = Pt(10)

    # Bottom Callout
    bot_card = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.25), Inches(11.733), Inches(0.7))
    bot_card.fill.solid()
    bot_card.fill.fore_color.rgb = GREEN_LIGHT
    bot_card.line.color.rgb = GREEN_ACCENT
    bot_card.line.width = Pt(1)
    btf = bot_card.text_frame
    bp = btf.paragraphs[0]
    bp.alignment = PP_ALIGN.CENTER
    bp.text = "Designed for challenging rural, multilingual, and low-connectivity environments across India."
    bp.font.bold = True
    bp.font.size = Pt(11)
    bp.font.color.rgb = GREEN_PRIMARY

    set_notes(s9, "MANOMITRA is differentiated across five fundamental pillars: language, accessibility, offline connectivity, cultural familiarity, and closed-loop caregiving. It is designed from line one for India's diverse, low-connectivity realities.")

    # =========================================================================
    # SLIDE 10: VALIDATION + ROADMAP + CLOSE
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_background(s10)
    add_header(s10, 10, "FROM PROTOTYPE TO IMPACT", "A structured roadmap from working prototype to community impact.")

    # Visual Roadmap (Top)
    r_y = Inches(1.8)
    r_h = Inches(2.2)
    add_card(s10, Inches(0.8), r_y, Inches(7.5), r_h, "PHASED ROADMAP", border_color=GREEN_PRIMARY)
    
    phases = [
        ("NOW", "Working Prototype", "5 games, PWA, local sync & WhatsApp bot", GREEN_PRIMARY),
        ("NEXT", "Cohort Pilot", "Testing with seniors + family caregivers", GREEN_ACCENT),
        ("VALIDATE", "Evidence Analysis", "Usability, adherence & trend evaluation", GREEN_PRIMARY),
        ("SCALE", "Public Integration", "More languages & primary health kiosk", BURGUNDY_DARK)
    ]
    ph_w = Inches(1.6)
    ph_gap = Inches(0.25)
    for i, (ptag, ptitle, pdesc, pcol) in enumerate(phases):
        px = Inches(1.0) + i * (ph_w + ph_gap)
        add_card(s10, px, r_y + Inches(0.5), ph_w, Inches(1.45), border_color=pcol, bg_color=CARD_BG)
        tb = s10.shapes.add_textbox(px + Inches(0.1), r_y + Inches(0.6), ph_w - Inches(0.2), Inches(1.25))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = ptag
        p1.font.bold = True
        p1.font.size = Pt(11)
        p1.font.color.rgb = pcol

        p2 = tf.add_paragraph()
        p2.text = ptitle
        p2.font.bold = True
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MAIN
        p2.space_before = Pt(2)

        p3 = tf.add_paragraph()
        p3.text = pdesc
        p3.font.size = Pt(8.5)
        p3.font.color.rgb = TEXT_MUTED
        p3.space_before = Pt(4)

        if i < 3:
            add_arrow(s10, px + ph_w, r_y + Inches(1.05), ph_gap, Inches(0.4), text="➔")

    # What We Will Measure Card (Top Right)
    add_card(s10, Inches(8.5), r_y, Inches(4.033), r_h, "WHAT WE WILL MEASURE (PILOT)", border_color=CARD_BORDER)
    tb_m = s10.shapes.add_textbox(Inches(8.7), r_y + Inches(0.45), Inches(3.633), Inches(1.6))
    tf_m = tb_m.text_frame
    metrics = [
        "• Usability & interface navigation friction",
        "• 14-day routine adherence rate",
        "• Touch error rates in senior interactions",
        "• Caregiver notification usefulness",
        "• Multi-session reaction latency stability"
    ]
    for i, m in enumerate(metrics):
        p = tf_m.paragraphs[0] if i == 0 else tf_m.add_paragraph()
        p.text = m
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_MUTED
        if i > 0:
            p.space_before = Pt(3)

    # Strong Closing Block (Bottom)
    close_y = Inches(4.25)
    close_h = Inches(2.7)
    add_card(s10, Inches(0.8), close_y, Inches(11.733), close_h, border_color=GREEN_PRIMARY, bg_color=GREEN_LIGHT)
    
    tb_cl = s10.shapes.add_textbox(Inches(1.0), close_y + Inches(0.2), Inches(11.333), Inches(2.3))
    tf_cl = tb_cl.text_frame
    tf_cl.word_wrap = True

    p0 = tf_cl.paragraphs[0]
    p0.alignment = PP_ALIGN.CENTER
    p0.text = "MANOMITRA"
    p0.font.bold = True
    p0.font.size = Pt(36)
    p0.font.color.rgb = GREEN_PRIMARY

    p1 = tf_cl.add_paragraph()
    p1.alignment = PP_ALIGN.CENTER
    p1.text = '"Your Companion for a Healthier Mind."'
    p1.font.bold = True
    p1.font.size = Pt(16)
    p1.font.color.rgb = BURGUNDY_DARK
    p1.space_before = Pt(2)

    p2 = tf_cl.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.text = "PLAY   •   MEASURE   •   ADAPT   •   TRACK   •   SUPPORT"
    p2.font.bold = True
    p2.font.size = Pt(13)
    p2.font.color.rgb = GREEN_PRIMARY
    p2.space_before = Pt(8)

    p3 = tf_cl.add_paragraph()
    p3.alignment = PP_ALIGN.CENTER
    p3.text = '"Care should not depend on memory, language, or connectivity."'
    p3.font.italic = True
    p3.font.size = Pt(13)
    p3.font.color.rgb = TEXT_MAIN
    p3.space_before = Pt(8)

    set_notes(s10, "Our roadmap is disciplined: from working prototype to user pilot, validation, and scale. Cognitive care should not depend on memory, language, or connectivity. MANOMITRA makes care continuous, accessible, and human. Thank you.")

    # Save Presentation
    prs.save(output_path)
    print(f"Successfully generated 10-slide PowerPoint presentation at: {output_path}")

if __name__ == "__main__":
    create_deck()
