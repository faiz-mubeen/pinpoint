import streamlit as st
import requests
import json
import base64
import re
from datetime import datetime
import io

# --- Configuration & Constants ---
st.set_page_config(page_title="MoSJE AI", page_icon="✨", layout="wide")

SYSTEM_PROMPT = """You are "MoSJE AI", an official, futuristic, and highly intelligent virtual assistant for the Ministry of Social Justice & Empowerment (MoSJE), Government of India. 
Your primary purpose is to assist users with accurate, detailed, and helpful information regarding MoSJE schemes and initiatives.

You must be an expert on the following schemes:
- e-ANUDAAN (NGO GIA Proposal System)
- Nasha Mukt Bharat Abhiyaan (NMBA)
- Pradhan Mantri Anushuchit Jaati Abhyuday Yojana (PM-AJAY)
- Ageing with Dignity (Senior Citizens Welfare)
- National Overseas Scholarship Scheme
- Smile- Beggary Portal
- National Portal For Transgender Persons
- Post Matric Scholarship for SC students (National Scholarship Portal)
- Pradhan Mantri Dakshta Aur Kushalta Sampann Hitgrahi Yojana (PM DAKSH)
- National Helpdesk for Prevention of Atrocities (POA)
- Development Action Plan for Scheduled Castes
- Drug Abuse Monitoring System (DAMS)
- National Action for Mechanised Sanitation Ecosystem (NAMASTE)
- National Helpline for Senior Citizens (NHSC)
- Training for Augmenting Productivity and Services (TAPAS)
- PM-SURAJ

Guidelines:
1. Always be professional, polite, and empathetic.
2. Provide structured answers (use bullet points, bold text for key terms).
3. If asked about something unrelated to MoSJE or social justice, politely decline and redirect the user to MoSJE-related topics.
4. Keep your responses concise but informative. If a user asks for eligibility or benefits, list them clearly.
5. You have access to Google Search. Use it to verify the latest guidelines and portal links."""

SUGGESTED_QUESTIONS = [
    "What is the eligibility for PM-DAKSH?",
    "How to apply for NGO funding via e-ANUDAAN?",
    "Tell me about the Nasha Mukt Bharat Abhiyaan.",
    "What are the benefits under PM-AJAY?",
    "Details on the SMILE scheme for Transgender persons?"
]

# --- State Management ---
if "messages" not in st.session_state:
    st.session_state.messages = []

# --- API Utility Functions ---
def call_gemini_chat(api_key, history, new_text):
    formatted_history = []
    for msg in history:
        formatted_history.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [{"text": msg["text"]}]
        })
    
    formatted_history.append({
        "role": "user",
        "parts": [{"text": new_text}]
    })

    payload = {
        "contents": formatted_history,
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "tools": [{"google_search": {}}]
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={api_key}"
    response = requests.post(url, headers={'Content-Type': 'application/json'}, json=payload)
    response.raise_for_status()
    return response.json()

def call_gemini_tts(api_key, text):
    clean_text = re.sub(r'[*#]', '', text)
    payload = {
        "contents": [{"parts": [{"text": clean_text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Aoede"}}}
        },
        "model": "gemini-2.5-flash-preview-tts"
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key={api_key}"
    response = requests.post(url, headers={'Content-Type': 'application/json'}, json=payload)
    response.raise_for_status()
    
    data = response.json()
    inline_data = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('inlineData', {})
    
    if 'data' in inline_data:
        audio_bytes = base64.b64decode(inline_data['data'])
        return audio_bytes
    return None

def call_scheme_matcher(api_key, profile):
    prompt = f"""Based on this citizen profile, list the top MoSJE schemes they might be eligible for. 
    Profile: Age {profile['age']}, Category: {profile['category']}, Income: {profile['income']}, Other: {profile['other']}.
    Provide a concise, bulleted list with scheme names in bold and a 1-sentence reason for the match. Do not invent schemes."""

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": "You are an expert MoSJE eligibility analyzer. Only suggest valid MoSJE schemes."}]}
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={api_key}"
    response = requests.post(url, headers={'Content-Type': 'application/json'}, json=payload)
    response.raise_for_status()
    data = response.json()
    return data['candidates'][0]['content']['parts'][0]['text']

# --- Sidebar UI ---
with st.sidebar:
    st.markdown("### ✨ MoSJE AI Settings")
    api_key = st.text_input("Gemini API Key", type="password", placeholder="Enter your API key...")
    
    st.divider()
    
    if st.button("➕ New Session", use_container_width=True):
        st.session_state.messages = []
        st.rerun()
        
    st.markdown("### 💾 Session Management")
    
    # Export
    export_data = json.dumps(st.session_state.messages, indent=2)
    st.download_button(
        label="📥 Export Chat (JSON)",
        data=export_data,
        file_name=f"mosje_chat_session_{datetime.now().strftime('%Y-%m-%d')}.json",
        mime="application/json",
        use_container_width=True
    )
    
    # Import
    uploaded_file = st.file_uploader("📤 Import Chat (JSON)", type=["json"])
    if uploaded_file is not None:
        try:
            st.session_state.messages = json.load(uploaded_file)
            st.success("Chat imported successfully!")
        except Exception as e:
            st.error("Invalid JSON file.")

    st.divider()
    
    # Scheme Matcher
    st.markdown("### 🎯 AI Scheme Matcher")
    with st.form("scheme_matcher_form"):
        m_age = st.number_input("Age", min_value=0, max_value=120, value=0)
        m_cat = st.selectbox("Social Category", ["", "SC", "OBC", "Transgender", "Senior Citizen", "General/Other"])
        m_inc = st.text_input("Annual Income (₹)", placeholder="e.g. 2,00,000")
        m_oth = st.text_input("Other Details", placeholder="e.g. Student, NGO worker")
        
        submit_matcher = st.form_submit_button("Find Eligible Schemes", use_container_width=True)
        
    if submit_matcher:
        if not api_key:
            st.error("Please enter an API Key first.")
        elif not m_age or not m_cat:
            st.warning("Age and Category are required.")
        else:
            with st.spinner("Analyzing MoSJE databases..."):
                try:
                    profile = {"age": m_age, "category": m_cat, "income": m_inc, "other": m_oth}
                    result = call_scheme_matcher(api_key, profile)
                    st.info(result)
                except Exception as e:
                    st.error(f"Failed to analyze: {e}")

# --- Main UI ---
st.title("Ministry of Social Justice & Empowerment")
st.caption("🟢 System Online | Citizen Information Portal")

# Display Suggested Questions if empty
if not st.session_state.messages:
    st.markdown("### How can I assist you today?")
    st.markdown("Ask me anything about MoSJE schemes including PM-DAKSH, SMILE, PM-AJAY, NMBA, and more.")
    
    cols = st.columns(2)
    for i, q in enumerate(SUGGESTED_QUESTIONS):
        with cols[i % 2]:
            if st.button(q, key=f"sug_{i}", use_container_width=True):
                # We store the question in session state to be picked up by the chat input flow
                st.session_state.selected_suggestion = q

# Check if a suggestion was clicked or text was input
prompt = st.chat_input("Ask about PM-DAKSH, e-ANUDAAN, or other schemes...")
if hasattr(st.session_state, 'selected_suggestion'):
    prompt = st.session_state.selected_suggestion
    del st.session_state.selected_suggestion

# Display Chat History
for i, msg in enumerate(st.session_state.messages):
    with st.chat_message(msg["role"]):
        st.markdown(msg["text"])
        
        # Display Bot Extras (Sources & TTS)
        if msg["role"] == "model":
            col1, col2 = st.columns([1, 5])
            
            # TTS Button
            with col1:
                if st.button("🔊 Listen", key=f"tts_{i}"):
                    if api_key:
                        with st.spinner("Generating audio..."):
                            audio_bytes = call_gemini_tts(api_key, msg["text"])
                            if audio_bytes:
                                st.audio(audio_bytes, format="audio/wav")
                            else:
                                st.error("Failed to generate audio.")
                    else:
                        st.warning("API Key required for TTS.")

            # Sources 
            if msg.get("sources"):
                with st.expander("🔗 Verified Sources"):
                    for src in msg["sources"]:
                        st.markdown(f"- [{src['title']}]({src['uri']})")

# Handle New Message
if prompt:
    if not api_key:
        st.warning("Please enter your Gemini API Key in the sidebar to continue.")
        st.stop()
        
    st.session_state.messages.append({"role": "user", "text": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("model"):
        with st.spinner("Accessing MoSJE Database..."):
            try:
                response_data = call_gemini_chat(api_key, st.session_state.messages[:-1], prompt)
                
                candidate = response_data.get('candidates', [{}])[0]
                response_text = candidate.get('content', {}).get('parts', [{}])[0].get('text', "Error generating response.")
                
                # Extract Grounding Attributions
                sources = []
                attributions = candidate.get('groundingMetadata', {}).get('groundingAttributions', [])
                unique_uris = set()
                
                for attr in attributions:
                    web = attr.get('web', {})
                    uri = web.get('uri')
                    title = web.get('title')
                    if uri and title and uri not in unique_uris:
                        unique_uris.add(uri)
                        sources.append({"uri": uri, "title": title})

                st.markdown(response_text)
                
                new_msg = {"role": "model", "text": response_text, "sources": sources}
                st.session_state.messages.append(new_msg)
                st.rerun()

            except Exception as e:
                st.error(f"Communication array disconnected. Error: {str(e)}")