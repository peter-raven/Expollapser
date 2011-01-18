namespace UnitTests
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Xml.Linq;

    public class QUnitTestResultsParser : IJavascriptTestResultsParser
    {
        /// <summary>
        /// Grabs the test results from web page.
        /// </summary>
        /// <param name="pageUrl">The test page.</param>
        /// <returns>List of test results</returns>
        public IEnumerable<JavascriptUnitTest> GetTestResults(string resultHtml, string pageUrl)
        {
            if (resultHtml == null)
            {
                yield break;
            }
            var documentRoot = XDocument.Load(new StringReader(makeXHtml(resultHtml))).Root;
            if (documentRoot == null)
            {
                yield break;
            }

            foreach (var listItem in documentRoot.Elements())
            {
                var testName = listItem.Elements().First(x => JavascriptUnitTestHelpers.Is(x.Name, "strong")).Value;
                var resultClass = listItem.Attributes().First(x => x.Name.Is("class")).Value;
                var failedAssert = String.Empty;
                if (resultClass == "fail")
                {
                    var specificAssertFailureListItem = listItem.Elements()
                        .First(x => x.Name.Is("ol")).Elements()
                        .First(x => x.Name.Is("li") && x.Attributes().First(a => a.Name.Is("class")).Value == "fail");
                    if (specificAssertFailureListItem != null)
                    {
                        failedAssert = specificAssertFailureListItem.Value;
                    }
                }

                yield return new JavascriptUnitTest
                    {
                        FileName = pageUrl,
                        TestName = removeAssertCounts(testName),
                        Result = resultClass,
                        Message = failedAssert
                    };
            }
        }

        private static string makeXHtml(string html)
        {
            return html.Replace("class=pass", "class=\"pass\"")
                .Replace("class=fail", "class=\"fail\"")
                .Replace("id=tests", "id=\"tests\"");
        }


        private static string removeAssertCounts(string fullTagText)
        {
            if (fullTagText == null) return String.Empty;
            int parenPosition = fullTagText.IndexOf('(');
            if (parenPosition > 0)
            {
                return fullTagText.Substring(0, parenPosition);
            }
            return fullTagText;
        }
    }
}