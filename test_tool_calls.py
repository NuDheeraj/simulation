"""
Test script to check if your LLM model supports tool calling
"""
import os
from openai import OpenAI

# Your configuration
LLM_BASE_URL = os.environ.get('LLM_BASE_URL', 'http://127.0.0.1:1234/v1')
LLM_MODEL = os.environ.get('LLM_MODEL', 'openai/gpt-oss-20b')
LLM_API_KEY = os.environ.get('LLM_API_KEY', '18b3a699-cbb6-4b66-b9ae-5f15871539fa')

print(f"🔧 Testing tool call support...")
print(f"🌐 Base URL: {LLM_BASE_URL}")
print(f"🤖 Model: {LLM_MODEL}")
print()

# Initialize client
client = OpenAI(
    api_key=LLM_API_KEY,
    base_url=LLM_BASE_URL
)

# Define a simple function
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City name"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"]
                    }
                },
                "required": ["location"]
            }
        }
    }
]

try:
    print("📤 Sending test request with tool calling...")
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "user", "content": "What's the weather like in San Francisco?"}
        ],
        tools=tools,
        tool_choice="auto",
        max_tokens=500
    )
    
    message = response.choices[0].message
    
    print("\n" + "="*60)
    print("📥 RESPONSE RECEIVED")
    print("="*60)
    
    # Check for tool calls
    if message.tool_calls and len(message.tool_calls) > 0:
        print("\n✅ SUCCESS! Your model SUPPORTS tool calling!")
        print("\n🔧 Tool Call Details:")
        tool_call = message.tool_calls[0]
        print(f"   Function: {tool_call.function.name}")
        print(f"   Arguments: {tool_call.function.arguments}")
        print("\n✨ This is great! The model can use structured function calls.")
        
    elif message.content:
        print("\n⚠️  Model returned CONTENT instead of tool call")
        print(f"\n📄 Content: {message.content}")
        print("\n❌ Your model does NOT support tool calling natively.")
        print("   It will fall back to content parsing mode.")
        
    else:
        print("\n❓ Unexpected response format")
        print(f"   Message: {message}")
    
    print("\n" + "="*60)
    print(f"Finish Reason: {response.choices[0].finish_reason}")
    print("="*60)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print(f"   Error Type: {type(e).__name__}")
    print("\nThis might mean:")
    print("  1. The server doesn't support the 'tools' parameter")
    print("  2. The model doesn't support function calling")
    print("  3. There's a connection issue")

print("\n" + "="*60)
print("RECOMMENDATIONS:")
print("="*60)

print("""
If your model SUPPORTS tool calls (✅):
  → Great! The new code will work perfectly
  → You'll see fewer JSON parsing errors
  → More reliable structured responses

If your model DOES NOT support tool calls (❌):
  → Don't worry! The code has fallback mechanisms
  → But we have better solutions:
    1. Use a model that supports tool calls (recommended)
    2. Use JSON mode / structured outputs
    3. Increase max_tokens and improve prompts
    
Try these models that support tool calls:
  - GPT-4 / GPT-3.5-turbo (via OpenAI)
  - Llama 3.1 (70B or 8B) with function calling fine-tune
  - Mistral 7B v0.3 or Mixtral
  - Hermes 2 Pro models (fine-tuned for function calling)
""")

