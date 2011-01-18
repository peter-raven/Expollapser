namespace UnitTests
{
    using System;
    using System.Xml.Linq;

    using NUnit.Framework;

    public static class JavascriptUnitTestHelpers
    {
        public static void ShouldPass(this JavascriptUnitTest theTest)
        {
            Assert.That(theTest.Result.Split(' '), Has.Member("pass"), theTest.Message);
        }

        public static bool Is(this XName xname, string name)
        {
            return xname.ToString().Equals(name, StringComparison.OrdinalIgnoreCase);
        }
    }
}