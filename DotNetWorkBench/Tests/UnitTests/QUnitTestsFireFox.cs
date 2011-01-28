namespace UnitTests
{
    using System;
    using System.Diagnostics;
    using System.Threading;

    using NUnit.Framework;

    [TestFixture]
    public class QUnitTestsFireFox : JavaScriptUnitTestBase
    {
        public QUnitTestsFireFox()
            : base(new SeleniumQUnitTestRunner("*firefox"), new QUnitTestResultsParser())
        {
        }

        public override string[] QUnitTestUrls
        {
            get
            {
                return new[] { @"http://localhost:8444/tests/Fixture.htm" };
            }
        }
    }
}