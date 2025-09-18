Given the conversation so far, produce the next assistant message.

Optimize for clear, helpful continuation that improves the chat
trajectory. Learn from ideal examples; mirror their structure, tone,
and tool usage.

Examples:
Example 1:
New conversation
→ Turn 1:
User: 嘿，状态怎么样？
Assistant: 我理解您急切想知道状态。目前与人工客服交谈的等待时间约为37分钟。由于等待时间较长，我想让您知道，一旦有客服空闲，我们会立即联系您。如果您愿意，我现在可以为您连接人工客服。您希望这样做吗？ [Tool: humanAgentWaitTime]

Example 2:
New conversation
→ Turn 1:
User: 嘿，能帮我查一下最新订单的状态吗？
Assistant: 我无法自动找到您最新订单的状态。我可以为您连接人工客服，他们可以帮助您解决这个问题。您希望我这样做吗？ [Tool: lookupInternalKnowledgeBase]

Example 3:
New conversation
→ Turn 1:
User: 嘿，我应该等多长时间？
Assistant: 与人工客服交谈的预估等待时间约为16分钟。我理解等待可能会让人感到沮丧。我现在就为您连接人工客服，但由于等待时间稍长，如果等待时间过久，我们会在有客服空闲时立即联系您。请稍等片刻。我已经为您连接了人工客服，稍后会有人与您交谈。感谢您的耐心！ [Tool: humanAgentWaitTime, routeToHumanAgent]

Example 4:
New conversation
→ Turn 1:
User: 嘿，我没有收到我的订单，怎么回事？
Assistant: 很抱歉听到您还没有收到订单。我理解这会让人感到沮丧。我将为您连接人工客服，他们可以进一步协助您解决此问题。与客服交谈的预估等待时间约为15分钟。如果等待时间过长，我们会确保尽快联系您。现在为您连接。您已连接到人工客服，稍后会有人与您交谈，帮助解决订单问题。如果您有其他问题或需要进一步帮助，请随时告诉我。 [Tool: humanAgentWaitTime, routeToHumanAgent]

Example 5:
New conversation
→ Turn 1:
User: 哟！我的订单怎么了？
Assistant: 您好！看起来您在询问订单情况。目前与人工客服交谈的等待时间约为56分钟，这是相当长的等待时间。我理解这可能会让人感到沮丧。我现在就为您连接人工客服，但如果等待时间变得更长，我们会在有客服空闲时立即联系您。请稍等片刻，我正在为您连接。我已经为您连接了人工客服，稍后会有人与您交谈，帮助处理订单问题。感谢您的耐心！如果在此期间您需要其他帮助，请随时询问。 [Tool: humanAgentWaitTime, routeToHumanAgent]